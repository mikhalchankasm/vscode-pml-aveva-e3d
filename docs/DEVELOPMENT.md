# 🛠️ Разработка расширения PML для VS Code

## 🚀 Быстрый старт

### Вариант 1: F5 (рекомендуется для разработки)
```bash
# В текущей папке
1. Открой папку в VS Code
2. Нажми F5
3. Откроется новое окно VS Code с расширением
4. Изменения автоматически пересобираются (watch mode)
```

### Вариант 2: Локальная установка (для тестирования)
```bash
# Собрать .vsix
vsce package

# Установить локально
code --install-extension pml-aveva-e3d-0.1.0.vsix

# Обновить после изменений
code --uninstall-extension <publisher>.pml-aveva-e3d
vsce package
code --install-extension pml-aveva-e3d-0.1.0.vsix
```

### Вариант 3: Symlink (использовать как обычное расширение)
```bash
# Windows
mklink /D "%USERPROFILE%\.vscode\extensions\pml-aveva-e3d" "C:\путь\к\vscode-pml-extension"

# Перезапустить VS Code
```

**Рекомендация:** Используй F5 для разработки, локальную установку для финального тестирования.

---

## 📁 Структура проекта

```
vscode-pml-extension/
│
├── 📝 ДОКУМЕНТАЦИЯ
│   ├── README.md           ← Для пользователей (GitHub/Marketplace)
│   ├── CHANGELOG.md        ← История версий
│   ├── PLAN.md             ← Общий план проекта
│   ├── TODO.md             ← Баги, фичи, идеи
│   ├── NEXT_STEPS.md       ← Конкретные шаги
│   └── DEVELOPMENT.md      ← Ты здесь (для разработчиков)
│
├── 🎨 ПОДСВЕТКА И SNIPPETS
│   ├── syntaxes/
│   │   └── pml.tmLanguage.json   ← Грамматика подсветки
│   ├── snippets/
│   │   └── pml.json              ← Шаблоны кода
│   └── language-configuration.json ← Скобки, комментарии
│
├── 💻 ИСХОДНЫЙ КОД (TypeScript)
│   ├── src/
│   │   ├── extension.ts      ← Главный файл (регистрация)
│   │   ├── formatter.ts      ← Форматирование
│   │   ├── diagnostics.ts    ← Проверка ошибок
│   │   ├── completion.ts     ← Автодополнение
│   │   └── hover.ts          ← Подсказки при наведении
│   │
│   └── out/                  ← Скомпилированный JS (не трогать)
│
├── ⚙️ КОНФИГУРАЦИЯ
│   ├── package.json          ← Манифест расширения
│   ├── tsconfig.json         ← Настройки TypeScript
│   ├── .vscodeignore         ← Исключения при публикации
│   └── .vscode/
│       ├── launch.json       ← Настройки F5
│       └── tasks.json        ← Задачи компиляции
│
└── 🧪 ТЕСТИРОВАНИЕ
    └── test.pml              ← Файл для тестов

```

---

## 🔧 Куда писать код

### 1. Новая функция подсветки
**Файл:** `syntaxes/pml.tmLanguage.json`

```json
// Добавить новое ключевое слово
"patterns": [
  {
    "name": "keyword.control.pml",
    "match": "\\b(новое_слово)\\b"
  }
]
```

### 2. Новый snippet
**Файл:** `snippets/pml.json`

```json
"Имя шаблона": {
  "prefix": "префикс",
  "body": [
    "строка 1",
    "${1:placeholder}"
  ],
  "description": "Описание"
}
```

### 3. Новое правило форматирования
**Файл:** `src/formatter.ts`

```typescript
// В классе PMLFormatter добавить метод
private myNewFormattingRule(text: string): string {
    // Логика
    return formattedText;
}

// Вызвать в provideDocumentFormattingEdits()
```

### 4. Новая проверка ошибок
**Файл:** `src/diagnostics.ts`

```typescript
// В классе PMLDiagnostics добавить метод
private checkMyNewRule(lines: string[], diagnostics: vscode.Diagnostic[], document: vscode.TextDocument): void {
    // Логика проверки
    this.addDiagnostic(diagnostics, lineNumber, "Сообщение", severity);
}

// Вызвать в updateDiagnostics()
```

### 5. Новое автодополнение
**Файл:** `src/completion.ts`

```typescript
// В методе provideCompletionItems() или добавить новый метод
private getMyCompletions(): vscode.CompletionItem[] {
    return [...];
}
```

### 6. Новая hover подсказка
**Файл:** `src/hover.ts`

```typescript
// В getDocumentation() добавить в объект
'ключевое_слово': {
    signature: 'синтаксис',
    description: 'описание',
    example: 'пример кода'
}
```

### 7. Новая команда
**Файл:** `package.json` + новый файл в `src/`

```json
// В package.json
"commands": [
  {
    "command": "pml.myCommand",
    "title": "PML: Моя команда"
  }
]
```

```typescript
// src/myFeature.ts
export function myCommand() {
    // Реализация
}

// src/extension.ts
import { myCommand } from './myFeature';
context.subscriptions.push(
    vscode.commands.registerCommand('pml.myCommand', myCommand)
);
```

---

## 📝 Система отслеживания

### Баги → TODO.md (раздел "Баги и исправления")
```markdown
### Критичные
- [ ] **Подсветка ломается на длинных строках** - проверить regex
  - Файл: syntaxes/pml.tmLanguage.json
  - Воспроизвести: test.pml строка 150
```

### Новые функции → TODO.md (раздел "Новые функции")
```markdown
### Навигация
- [ ] **Symbol Provider** - дерево методов
  - Файл: создать src/symbols.ts
  - API: vscode.DocumentSymbolProvider
  - Приоритет: HIGH
```

### Реализовано → CHANGELOG.md
```markdown
## [0.2.0] - 2025-XX-XX

### Добавлено
- Сортировка методов (A→Z, Z→A, по длине)
- Интерактивная переупорядочивание методов
```

### Идеи для обсуждения → TODO.md (раздел "Идеи")
```markdown
### Type Inference для PML
- [ ] **Вывод типов переменных** - LSP
  - !pipe: Array<String>
  - Проверка .Real() на String
  - Требует: парсер AST
```

---

## 🔄 Workflow разработки

### Ежедневная работа

```bash
# 1. Открыть VS Code в папке проекта
cd vscode-pml-extension
code .

# 2. Запустить watch mode (автокомпиляция)
npm run watch

# 3. Нажать F5 → откроется окно с расширением

# 4. Редактировать код
# TypeScript автоматически компилируется
# Нажми Ctrl+R в окне расширения для перезагрузки

# 5. Тестировать на test.pml
```

### Добавление новой функции

```
1. Записать в TODO.md что планируешь
2. Создать/изменить нужные файлы (см. выше)
3. Скомпилировать: npm run compile
4. Протестировать: F5
5. Записать в CHANGELOG.md что сделано
6. Обновить README.md если нужно
7. Commit в git
```

### Исправление бага

```
1. Записать в TODO.md баг
2. Воспроизвести в test.pml
3. Исправить код
4. Протестировать: F5
5. Отметить [x] в TODO.md
6. Записать в CHANGELOG.md
7. Commit в git
```

---

## 📊 Текущий функционал

### ✅ Реализовано (v0.1.0)
- Подсветка синтаксиса (60+ ключевых слов)
- 35+ snippets
- Автоформатирование (3 правила)
- Диагностика ошибок (5 типов)
- Автодополнение (IntelliSense)
- Hover подсказки

### 🔄 В разработке
- (Пусто пока)

### ⏳ Запланировано (см. TODO.md)
- Сортировка методов (из ChatGPT файла)
- Symbol Provider
- Definition Provider
- Type inference

---

## 🎯 Идеи из ChatGPT файла

### 1. Сортировка методов ⭐ ПРИОРИТЕТ
```
Команды:
- PML: Сортировать методы (A→Z)
- PML: Сортировать методы (Z→A)
- PML: Сортировать по длине
- PML: Переупорядочить интерактивно

Где: меню в title bar для .pml файлов
Файл: создать src/methodSorter.ts
```

### 2. Type Inference для PML 🔬 СЛОЖНО
```
Понимание типов:
- !pipe: Array<String> (индексация с 1)
- digit = !pipe[1].Real() → warning если String
- Проверка Undefined элементов

Требует:
- Парсер PML → AST
- Type checker
- Language Server (LSP)

Этапы:
1. Базовый парсер переменных
2. Отслеживание присваиваний
3. Вывод типов (простой)
4. Диагностика type mismatch
5. LSP сервер (опционально)
```

### 3. PML специфика
```
Массивы:
- Индексация с 1 (не с 0!)
- !arr[0] → warning "PML arrays start at 1"
- size() возвращает размер

Типы:
- STRING → .Real() → REAL
- REAL → .String() → STRING
- Undefined при выходе за границы
```

---

## 🐛 Частые проблемы

### Проблема: Изменения не применяются в F5 окне
**Решение:** Нажми Ctrl+R в окне Extension Development Host

### Проблема: TypeScript ошибки
**Решение:** 
```bash
npm run compile
# Исправить ошибки
```

### Проблема: Расширение не активируется
**Решение:** Проверь `package.json` → `activationEvents`

### Проблема: Hover/Completion не работает
**Решение:** Проверь регистрацию provider в `src/extension.ts`

---

## 📦 Публикация

### GitHub
```bash
# 1. Создать репозиторий на GitHub
# 2. Добавить remote
git remote add origin https://github.com/username/vscode-pml-extension.git

# 3. Push
git add .
git commit -m "Initial release v0.1.0"
git push -u origin main

# 4. Создать Release
# GitHub → Releases → Create Release
# Tag: v0.1.0
# Приложить: pml-aveva-e3d-0.1.0.vsix
```

### Установка с GitHub
```bash
# Пользователи смогут:
1. Скачать .vsix из Releases
2. code --install-extension pml-aveva-e3d-0.1.0.vsix

# Или клонировать:
git clone https://github.com/username/vscode-pml-extension.git
cd vscode-pml-extension
npm install
npm run compile
code --install-extension .
```

### VS Code Marketplace (позже)
```bash
# 1. Аккаунт на https://marketplace.visualstudio.com/
# 2. Personal Access Token
# 3. Публикация
vsce package
vsce publish
```

---

## 🔍 Отладка

### Логи расширения
```typescript
// В любом файле src/
console.log('Debug message');
// Смотреть: Output → Extension Host
```

### Breakpoints
```typescript
// Поставить breakpoint в VS Code
// F5 → breakpoint сработает в новом окне
```

### Diagnostic Collection
```typescript
// src/diagnostics.ts
// Ошибки видны в Problems panel (Ctrl+Shift+M)
```

---

## ✅ Чеклист перед коммитом

- [ ] Код скомпилирован без ошибок
- [ ] Протестировано в F5
- [ ] Обновлен TODO.md (отметить сделанное)
- [ ] Обновлен CHANGELOG.md
- [ ] Обновлен README.md (если публичная фича)
- [ ] Понятный commit message
- [ ] Version bump если нужно (package.json)

---

## 📞 Контакты и помощь

- **Баги:** TODO.md → раздел "Баги"
- **Фичи:** TODO.md → раздел "Новые функции"
- **Вопросы:** GitHub Issues (после публикации)
- **Идеи:** TODO.md → раздел "Идеи для обсуждения"

---

*Последнее обновление: 2025-10-12*
*Версия: 0.1.0*

