# Архитектурный анализ проекта vscode-pml-extension

## Обзор проекта

**Тип проекта**: VS Code Extension для языка PML (AVEVA E3D)
**Архитектура**: Монорепозиторий с двумя основными компонентами:
- VSCode Extension Client (src/)
- Language Server Protocol Server (packages/pml-language-server/)

**Технологический стек**:
- TypeScript 5.1.6
- VSCode Language Client API 9.0.1
- VSCode Language Server API 9.0.1
- esbuild для бандлинга
- Vitest для тестирования

---

## КРИТИЧЕСКИЕ ПРОБЛЕМЫ И ОШИБКИ

### 1. ОТСУТСТВИЕ .EDITORCONFIG

**Проблема**: В проекте отсутствует файл `.editorconfig`, что может привести к проблемам с кодировкой и форматированием между разными редакторами и разработчиками.

**Исправление**: Создать `.editorconfig`:
```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true

[*.{ts,js,json}]
indent_style = space
indent_size = 4

[*.md]
trim_trailing_whitespace = false
```

**Рекомендация**: Стандартизировать комментарии на английском языке для лучшей совместимости.

---

### 2. ОТСУТСТВИЕ ОБРАБОТКИ ОШИБОК В КРИТИЧЕСКИХ МЕСТАХ

**Проблема 2.1**: В `src/extension.ts` при активации Language Server ошибка логируется, но расширение продолжает работать с неполным функционалом.

```25:29:src/extension.ts
} catch (error) {
    console.error('? Failed to start PML Language Server:', error);
    vscode.window.showErrorMessage(`PML Language Server failed to start: ${error}`);
}
```

**Исправление**: Добавить fallback-механизм или корректное завершение активации расширения при критических ошибках.

**Проблема 2.2**: В `src/languageClient.ts` проверка существования файла выполнена, но нет обработки случаев, когда файл существует, но не может быть выполнен (permissions, corrupted).

**Исправление**: Добавить проверку прав доступа и валидацию целостности файла.

---

### 3. ПОТЕНЦИАЛЬНЫЕ УТЕЧКИ ПАМЯТИ

**Проблема 3.1**: В `packages/pml-language-server/src/index/symbolIndex.ts` хранятся полные тексты документов для извлечения комментариев.

```67:71:packages/pml-language-server/src/index/symbolIndex.ts
// Map: file URI -> document text (for comment extraction)
private documentTexts: Map<string, string> = new Map();
```

**Проблема**: Нет механизма очистки текстов документов при закрытии файла или удалении из индекса.

**Исправление**: 
- Очищать `documentTexts` в методе `removeFile()`
- Рассмотреть хранение только необходимых фрагментов текста (комментарии перед методами)

**Проблема 3.2**: В `packages/pml-language-server/src/server.ts` используется `Map<string, Thenable<PMLSettings>>` для кэширования настроек, но нет очистки при закрытии документов в некоторых сценариях.

**Исправление**: Добавить явную очистку в обработчик `onDidClose`.

---

### 4. ПРОБЛЕМЫ С ТИПИЗАЦИЕЙ

**Проблема 4.1**: В `src/extension.ts` используется `any` тип неявно через `catch (error)`.

**Исправление**: 
```typescript
catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('? Failed to start PML Language Server:', message);
    vscode.window.showErrorMessage(`PML Language Server failed to start: ${message}`);
}
```

**Проблема 4.2**: ESLint конфигурация отключает проверку `@typescript-eslint/no-explicit-any`, что может скрывать проблемы.

**Рекомендация**: Включить предупреждения для `any` типов и исправить явные использования.

---

### 5. ОТСУТСТВИЕ GRACEFUL SHUTDOWN

**Проблема**: В `src/languageClient.ts` функция `deactivateLanguageServer()` возвращает `Thenable<void> | undefined`, но нет гарантии, что все ресурсы освобождены.

**Исправление**:
```typescript
export async function deactivateLanguageServer(): Promise<void> {
    if (!client) {
        return;
    }
    try {
        await client.stop();
        // Очистка дополнительных ресурсов
        client.dispose();
    } catch (error) {
        console.error('Error stopping language server:', error);
    } finally {
        client = undefined;
    }
}
```

---

### 6. НЕСИНХРОННОСТЬ КОНФИГУРАЦИИ

**Проблема**: В `packages/pml-language-server/src/server.ts` настройки загружаются асинхронно через `Thenable`, но используется сразу без ожидания.

```95:105:packages/pml-language-server/src/server.ts
function getDocumentSettings(resource: string): Thenable<PMLSettings> {
    if (!hasConfigurationCapability) {
        return Promise.resolve(globalSettings);
    }
    let result = documentSettings.get(resource);
    if (!result) {
        result = connection.workspace.getConfiguration({
            scopeUri: resource,
            section: 'pml'
        });
        documentSettings.set(resource, result);
    }
    return result;
}
```

**Проблема**: Функции валидации используют `getDocumentSettings()` без await, что может привести к использованию дефолтных настроек вместо реальных.

**Исправление**: Убедиться, что все вызовы `getDocumentSettings()` правильно обрабатывают Promise.

---

### 7. ОТСУТСТВИЕ ВАЛИДАЦИИ ВХОДНЫХ ДАННЫХ

**Проблема 7.1**: В `packages/pml-language-server/src/parser/parser.ts` нет проверки на null/undefined для токенов.

**Исправление**: Добавить guard-проверки перед использованием `this.peek()` и `this.consume()`.

**Проблема 7.2**: В `src/tools.ts` методы работают с активным редактором, но не проверяют состояние документа (read-only, etc.).

**Исправление**: Добавить проверки:
```typescript
if (editor.document.isUntitled) {
    vscode.window.showErrorMessage('Save document first');
    return;
}
if (editor.document.isDirty && !await saveDocument(editor)) {
    return;
}
```

---

### 8. ПРОБЛЕМЫ С ОБРАБОТКОЙ БОЛЬШИХ ФАЙЛОВ

**Проблема**: В `packages/pml-language-server/src/index/workspaceIndexer.ts` индексация больших workspace может занять много времени без уведомления пользователя.

**Исправление**:
- Добавить прогресс-индикатор через `connection.window.createWorkDoneProgress`
- Использовать батчинг для индексации
- Добавить возможность отмены индексации

---

### 9. НЕКОНСИСТЕНТНОСТЬ ОБРАБОТКИ ОШИБОК ПАРСИНГА

**Проблема**: В `packages/pml-language-server/src/server.ts` ошибки парсинга собираются, но нет единой стратегии их обработки (recovery vs fail-fast).

**Исправление**: Стандартизировать стратегию error recovery для парсера.

---

### 10. ОТСУТСТВИЕ РАСШИРЕННОЙ ОБРАБОТКИ ОШИБОК В ESBUILD

**Проблема**: В `esbuild.js` используется простой error handling без детальной информации.

**Исправление**: Добавить более детальное логирование ошибок сборки.

---

## АРХИТЕКТУРНЫЕ УЛУЧШЕНИЯ

### 11. РЕКОМЕНДАЦИИ ПО СТРУКТУРЕ КОДА

**11.1 Separation of Concerns**:
- ✅ Хорошо: Парсер, провайдеры, индексация разделены
- ⚠️ Улучшить: Логика форматирования слишком монолитна в `formatter.ts`

**Рекомендация**: Разбить `PMLFormatter` на отдельные классы:
- `IndentationFixer`
- `AlignmentFormatter`
- `MethodBlockFormatter`
- `FormBlockFormatter`

### 11.2 Dependency Injection**:
- ⚠️ Проблема: Жесткая связанность между компонентами
- **Рекомендация**: Использовать DI контейнер (например, Inversify) для управления зависимостями

### 11.3 Error Handling Strategy**:
- **Рекомендация**: Создать централизованный error handler:
```typescript
class ErrorHandler {
    static handle(error: unknown, context: string): void {
        // Логирование, уведомления, метрики
    }
}
```

---

## КОНФИГУРАЦИЯ И ИНСТРУМЕНТЫ

### 12. ПРОБЛЕМЫ С КОНФИГУРАЦИЕЙ TYPESCRIPT

**Проблема**: В `tsconfig.json` отсутствуют некоторые строгие проверки:
- `noUncheckedIndexedAccess` - отсутствует
- `noImplicitOverride` - отсутствует

**Рекомендация**: Добавить для повышения типобезопасности:
```json
{
  "compilerOptions": {
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true
  }
}
```

### 13. ОТСУТСТВИЕ PRE-COMMIT HOOKS

**Рекомендация**: Добавить husky + lint-staged для проверки кода перед коммитом.

---

## ТЕСТИРОВАНИЕ

### 14. ПОКРЫТИЕ ТЕСТАМИ

**Текущее состояние**:
- ✅ Есть unit-тесты для парсера, типо-детектора, arrayIndexChecker
- ⚠️ Отсутствуют тесты для:
  - Форматтера
  - Провайдеров (completion, hover, definition)
  - Индексации workspace
  - Language Client

**Рекомендация**: Довести покрытие до минимум 70% для критических компонентов.

---

## БЕЗОПАСНОСТЬ

### 15. ПРОБЛЕМЫ БЕЗОПАСНОСТИ

**15.1 Path Traversal**:
- ⚠️ В `workspaceIndexer.ts` нет проверки на path traversal при обработке путей файлов

**Исправление**: Валидировать пути через `path.resolve()` и проверять, что они внутри workspace:
```typescript
private validatePath(filePath: string, workspaceRoot: string): boolean {
    const resolved = path.resolve(filePath);
    const root = path.resolve(workspaceRoot);
    return resolved.startsWith(root);
}
```

**15.2 Небезопасный eval**:
- ✅ Не обнаружено прямого использования eval

**15.3 Отсутствие валидации URI**:
- ⚠️ В `completionProvider.ts` и других провайдерах используется `document.uri` без валидации

**Исправление**: Добавить проверку формата URI перед использованием.

---

## ПРОИЗВОДИТЕЛЬНОСТЬ

### 16. ОПТИМИЗАЦИИ

**16.1 Индексация**:
- ⚠️ Индексация workspace может блокировать event loop
- **Рекомендация**: Использовать worker threads или разбить на микротаски

**16.2 Кэширование**:
- ✅ Хорошо: Используется кэширование AST и символов
- ⚠️ Нет инвалидации кэша при изменениях зависимостей

**Рекомендация**: Добавить систему зависимостей между файлами для правильной инвалидации.

---

## ДОКУМЕНТАЦИЯ

### 17. ОТСУТСТВИЕ ARCHITECTURE DECISION RECORDS (ADR)

**Рекомендация**: Создать ADR для объяснения архитектурных решений:
- Почему выбран LSP вместо прямых провайдеров
- Почему используется esbuild вместо tsc
- Стратегия обработки ошибок парсинга

---

## КОНКРЕТНЫЕ ПРИМЕРЫ ИСПРАВЛЕНИЙ

### Пример 1: Очистка памяти в SymbolIndex

**Текущий код** (`packages/pml-language-server/src/index/symbolIndex.ts`):
```typescript
public removeFile(uri: string): void {
    // Remove from indexes
    const fileSymbols = this.fileSymbols.get(uri);
    if (!fileSymbols) return;

    // Remove methods
    for (const method of fileSymbols.methods) {
        // ... удаление из methodIndex
    }
    // ... аналогично для objects и forms
    
    this.fileSymbols.delete(uri);
    // ❌ ПРОБЛЕМА: documentTexts не очищается!
}
```

**Исправленный код**:
```typescript
public removeFile(uri: string): void {
    // Remove from indexes
    const fileSymbols = this.fileSymbols.get(uri);
    if (!fileSymbols) return;

    // Remove methods
    for (const method of fileSymbols.methods) {
        const key = method.name.toLowerCase();
        const methods = this.methodIndex.get(key);
        if (methods) {
            const filtered = methods.filter(m => m.uri !== uri);
            if (filtered.length === 0) {
                this.methodIndex.delete(key);
            } else {
                this.methodIndex.set(key, filtered);
            }
        }
    }
    // ... аналогично для objects и forms
    
    this.fileSymbols.delete(uri);
    // ✅ ИСПРАВЛЕНО: Очищаем documentTexts
    this.documentTexts.delete(uri);
}
```

### Пример 2: Улучшенная обработка ошибок в extension.ts

**Текущий код**:
```typescript
try {
    activateLanguageServer(context);
    console.log('? PML Language Server client started');
} catch (error) {
    console.error('? Failed to start PML Language Server:', error);
    vscode.window.showErrorMessage(`PML Language Server failed to start: ${error}`);
}
```

**Исправленный код**:
```typescript
try {
    const client = activateLanguageServer(context);
    console.log('? PML Language Server client started');
    
    // Регистрируем обработчик ошибок клиента
    client.onDidChangeState((event) => {
        if (event.newState === 2) { // Stopped
            console.error('Language Server stopped unexpectedly');
            vscode.window.showWarningMessage('PML Language Server stopped. Some features may be unavailable.');
        }
    });
} catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    
    console.error('? Failed to start PML Language Server:', message, stack);
    
    // Показываем детальное сообщение пользователю
    vscode.window.showErrorMessage(
        `PML Language Server failed to start: ${message}. ` +
        `Please check the Output panel for details.`,
        'View Output'
    ).then(selection => {
        if (selection === 'View Output') {
            vscode.commands.executeCommand('workbench.action.output.toggleOutput');
        }
    });
    
    // Не продолжаем активацию расширения, если критически важный компонент не запустился
    // Можно оставить базовый функционал (форматирование, tools) без LSP
}
```

### Пример 3: Валидация путей в WorkspaceIndexer

**Текущий код**:
```typescript
private async findPMLFiles(dirPath: string): Promise<string[]> {
    const pmlFiles: string[] = [];
    // ... рекурсивный обход
    return pmlFiles;
}
```

**Исправленный код**:
```typescript
private async findPMLFiles(dirPath: string, workspaceRoot: string): Promise<string[]> {
    const pmlFiles: string[] = [];
    
    // ✅ Валидация пути
    if (!this.isValidPath(dirPath, workspaceRoot)) {
        this.connection.console.error(`Invalid path detected: ${dirPath}`);
        return pmlFiles;
    }
    
    // ... рекурсивный обход с проверкой на каждом уровне
    return pmlFiles;
}

private isValidPath(filePath: string, workspaceRoot: string): boolean {
    try {
        const resolved = path.resolve(filePath);
        const root = path.resolve(workspaceRoot);
        
        // Проверка, что путь внутри workspace
        if (!resolved.startsWith(root)) {
            return false;
        }
        
        // Проверка на symlinks и другие потенциально опасные пути
        const normalized = path.normalize(resolved);
        if (normalized.includes('..')) {
            return false;
        }
        
        return true;
    } catch (error) {
        return false;
    }
}
```

### Пример 4: Graceful Shutdown

**Текущий код** (`src/languageClient.ts`):
```typescript
export function deactivateLanguageServer(): Thenable<void> | undefined {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
```

**Исправленный код**:
```typescript
export async function deactivateLanguageServer(): Promise<void> {
    if (!client) {
        return;
    }
    
    try {
        // Даем клиенту время на корректное завершение
        const timeout = new Promise<void>((resolve) => {
            setTimeout(() => resolve(), 5000); // 5 секунд максимум
        });
        
        await Promise.race([
            client.stop(),
            timeout
        ]);
        
        // Явно освобождаем ресурсы
        if (client) {
            client.dispose();
        }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('Error stopping language server:', message);
        // Продолжаем, даже если была ошибка
    } finally {
        client = undefined;
    }
}
```

---

## ПРИОРИТЕТЫ ИСПРАВЛЕНИЙ

### Критичные (P0):
1. Добавить `.editorconfig` для стандартизации кодировки и форматирования
2. Добавить очистку памяти в symbolIndex (documentTexts)
3. Улучшить обработку ошибок активации Language Server
4. Добавить валидацию путей в workspaceIndexer (path traversal protection)

### Высокие (P1):
5. Типизация error handling
6. Graceful shutdown
7. Валидация входных данных в tools.ts
8. Прогресс-индикатор для индексации

### Средние (P2):
9. Разбить formatter на модули
10. Добавить pre-commit hooks
11. Увеличить покрытие тестами
12. Добавить ADR документацию

### Низкие (P3):
13. Dependency Injection
14. Worker threads для индексации
15. Расширенное логирование

---

## ДОПОЛНИТЕЛЬНЫЕ ЗАМЕЧАНИЯ

### 18. ЗАКОММЕНТИРОВАННЫЙ КОД

**Проблема**: В `src/extension.ts` большое количество закомментированного кода (legacy providers), что усложняет чтение и поддержку.

**Рекомендация**: Удалить закомментированный код и использовать git history для восстановления при необходимости.

### 19. ОТСУТСТВИЕ ЛОГИРОВАНИЯ УРОВНЯ DEBUG

**Проблема**: Используется `console.log` вместо структурированного логирования.

**Рекомендация**: Использовать библиотеку логирования (например, `winston` или встроенный механизм VSCode) с уровнями:
- Error
- Warn  
- Info
- Debug

### 20. ОТСУТСТВИЕ МЕТРИК И МОНИТОРИНГА

**Рекомендация**: Добавить метрики производительности:
- Время парсинга файлов
- Размер индекса
- Количество ошибок парсинга
- Время индексации workspace

---

## ЗАКЛЮЧЕНИЕ

Проект имеет хорошую архитектурную основу с разделением на клиент и сервер (LSP), но требует:
- Улучшения обработки ошибок и edge cases
- Оптимизации использования памяти (очистка кэшей)
- Расширения тестового покрытия (особенно для провайдеров)
- Стандартизации кодировки и форматирования (`.editorconfig`)
- Добавления валидации входных данных и путей

Большинство проблем связаны с обработкой edge cases и отсутствием валидации, что может привести к нестабильности в production окружении. Проект находится в хорошем состоянии для дальнейшего развития, но требует рефакторинга для повышения надежности.

