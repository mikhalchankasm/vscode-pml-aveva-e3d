# 🎯 Следующие шаги развития расширения

**Дата:** 2025-10-19
**Текущая версия:** v0.5.1
**Статус:** Ready for testing

---

## 📋 Немедленные действия (сейчас)

### 1. **ТЕСТИРОВАНИЕ v0.5.1** 🔴 КРИТИЧНО

**Что тестировать:**

#### A. Проверить подсветку синтаксиса
- [ ] Открыть `examples/test2.pmlfrm` в Cursor/VSCode
- [ ] Проверить что keywords подсвечиваются:
  - `var`, `collect`, `all`, `with`, `compose`, `space`
  - `setup`, `form`, `frame`, `exit`
  - `do`, `from`, `to`, `by`
  - `if`, `then`, `neq`
- [ ] Проверить $ prefix: `$!indxA` должен подсвечиваться

#### B. Проверить ОТСУТСТВИЕ ложных ошибок
Эти строки **НЕ должны быть красными**:
```pml
var !result collect all (pipe equi) with (name eq 'TEST')
var !text compose |Hello| space |World|
var !dprt compose space $!indxA |END|
do !i from 1 to 10 by -1
if !x neq 5 then
```

Если **есть красные подчёркивания** - это проблема! Сообщите какие.

#### C. Проверить LSP функции
- [ ] F12 на `.action1` - должен перейти к определению (если метод есть)
- [ ] Ctrl+Shift+O - Document Outline (должны быть видны frame/button/text)
- [ ] Ctrl+Space - Completion (должны появляться переменные)
- [ ] Hover на keywords - должна быть подсказка

#### D. Открыть Output > PML Language Server
- [ ] Проверить логи - не должно быть ошибок
- [ ] Workspace indexed: X methods, X objects, X forms
- [ ] Не должно быть "Request failed" ошибок

**Результаты тестирования:**
- Запишите какие **есть** красные подчёркивания
- Скриншот проблемных мест
- Логи из Output > PML Language Server

---

## 🚀 Краткосрочные задачи (1-2 дня)

### 2. **Исправить найденные баги** 🔴

По результатам тестирования:
- Исправить parse errors
- Добавить недостающие keywords
- Улучшить error recovery

### 3. **Заполнить базу знаний** 🟡

**Приоритетные файлы:**

#### A. `objects/keywords.md` (КРИТИЧНО!)
Список всех PML keywords с примерами обоих синтаксисов:

```markdown
### collect / all / with / for

**PML1 Syntax:**
```pml
var !result collect all (TYPE) with (CONDITION) for CONTEXT
```

**PML2 Syntax:**
```pml
!result = !!collectallfor('TYPE', |CONDITION|, CONTEXT)
```

**Example:**
... примеры из документации ...
```

#### B. `objects/builtin functions.md` (ВАЖНО!)
```markdown
### compose

Concatenate parts into string.

**Syntax:**
```pml
var !result compose part1 part2 ...
```

**Example:**
```pml
var !text compose |Hello| space |World|  -- Result: |Hello World|
```
```

#### C. `objects/real object.md`, `objects/boolean object.md`
По аналогии с array/string objects.

---

## 📈 Среднесрочные задачи (1-2 недели)

### 4. **Улучшить парсер** 🟡

#### A. Добавить UnknownStatement/UnknownExpression
**Цель:** Graceful degradation для неизвестных конструкций

```typescript
// parser.ts
private parseUnknownStatement(): Statement {
    const tokens: Token[] = [];

    while (!this.isAtEnd() &&
           !this.check(TokenType.NEWLINE) &&
           !this.check(TokenType.ENDIF) &&
           !this.check(TokenType.ENDDO)) {
        tokens.push(this.advance());
    }

    return {
        type: 'UnknownStatement',
        tokens,
        range: this.createRange(0, this.current - 1)
    };
}
```

#### B. Парсинг PML1 collect syntax (опционально)
Если нужна полная поддержка:
```typescript
private parseCollectExpression(): Expression {
    this.consume(TokenType.COLLECT);

    if (this.check(TokenType.ALL)) {
        this.advance();
        // parse collect all (type) with (condition) for context
    }

    // ...
}
```

### 5. **Semantic Tokens Provider** 🟡

**Цель:** Умная подсветка на основе AST

```typescript
// semanticTokensProvider.ts
public provide(document: TextDocument): SemanticToken[] {
    const tokens: SemanticToken[] = [];
    const ast = this.parser.parse(document.getText());

    for (const node of ast.body) {
        if (node.type === 'VariableDeclaration') {
            tokens.push({
                tokenType: node.scope === 'global' ? 'variable.global' : 'variable.local',
                // ...
            });
        }
    }

    return tokens;
}
```

### 6. **Inlay Hints** 🟢

**Цель:** Показывать выведенные типы inline

```pml
!result = |hello|.upcase()  // : STRING
!count = !array.size()      // : REAL
```

---

## 🎯 Долгосрочные задачи (Phase 3-4)

### 7. **Enhanced Diagnostics**
- Type checking (опционально через настройки)
- Unused variables warnings
- PML-specific rules

### 8. **Quick Fixes**
- "Create method" action
- "Add endif/enddo"
- Type conversion suggestions

### 9. **Refactoring Actions**
- Extract Method
- Extract Variable
- Rename Symbol

### 10. **Code Lens**
- Show reference count above methods
- "Run method" (если возможна интеграция с AVEVA)

---

## 📊 Критерии готовности для v1.0.0

### Must Have (обязательно):
- [x] ✅ LSP сервер работает
- [x] ✅ Базовый парсер (keywords, variables, methods)
- [x] ✅ Go to Definition / Find References
- [x] ✅ Completion / Hover
- [x] ✅ Graceful parsing (no false errors)
- [ ] ⏳ Semantic Tokens
- [ ] ⏳ Inlay Hints
- [ ] ⏳ База знаний заполнена (keywords + builtin functions)

### Should Have (желательно):
- [ ] ⏳ Type inference для 70%+ случаев
- [ ] ⏳ Call Hierarchy
- [ ] ⏳ Code Lens
- [ ] ⏳ Basic Quick Fixes

### Nice to Have (опционально):
- [ ] ⏳ Refactoring actions
- [ ] ⏳ AVEVA E3D integration
- [ ] ⏳ Form preview

---

## 🔄 Процесс разработки

### После каждого изменения:

1. **Компиляция:**
   ```bash
   npm run compile
   ```

2. **Тестирование:**
   - F5 в VSCode (Extension Development Host)
   - Открыть test файлы
   - Проверить логи

3. **Если всё OK - Commit:**
   ```bash
   git add .
   git commit -m "feat/fix: описание"
   git push origin main
   ```

4. **Пересборка VSIX (для релиза):**
   ```bash
   npx vsce package
   powershell -ExecutionPolicy Bypass -File scripts/reinstall.ps1 -Version "X.Y.Z"
   ```

---

## 📝 Текущие TODO (приоритизированные)

### Сегодня:
1. 🔴 **Протестировать v0.5.1** на реальных файлах
2. 🔴 **Записать найденные баги** в Issues/TODO list
3. 🟡 **Начать заполнять keywords.md** (хотя бы топ-10 keywords)

### Эта неделя:
4. 🔴 **Исправить критичные баги** найденные при тестировании
5. 🟡 **Заполнить builtin functions.md** (compose, space, writefile)
6. 🟡 **Добавить UnknownStatement** в parser

### Следующая неделя:
7. 🟡 **Semantic Tokens Provider**
8. 🟡 **Inlay Hints Provider**
9. 🟢 **Улучшить документацию**

---

## 💡 Идеи для будущего

### Community Features:
- [ ] Marketplace publication
- [ ] GitHub Discussions
- [ ] Contribution guide
- [ ] Example projects repository

### Advanced Features:
- [ ] Snippet library
- [ ] PML formatter
- [ ] Linter rules
- [ ] Test runner integration
- [ ] AVEVA E3D debugger (если API доступен)

---

## 📞 Обратная связь

**После тестирования v0.5.1:**
- Создайте Issue для каждого бага
- Или напишите список здесь в комментарии
- Приложите скриншоты проблемных мест

**Вопросы:**
1. Какие конструкции подчёркивает красным?
2. Работает ли F12 на ваших методах?
3. Есть ли в Output логи с ошибками?
4. Какие ещё keywords часто используете?

---

**Last Updated:** 2025-10-19
**Next Review:** После тестирования v0.5.1
**Status:** 🟢 Ready for user testing