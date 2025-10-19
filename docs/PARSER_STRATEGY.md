# Parser Strategy: Graceful Degradation

**Принцип:** Распознаём что знаем, остальное не считаем ошибкой.

---

## 🎯 Философия парсера

### ❌ НЕ делаем (strict parsing):
```pml
var !result collect all (TYPE) with (CONDITION) for CONTEXT
                ^^^^^^^
                └─ ERROR: Unknown keyword "collect" ❌
```

### ✅ Делаем (graceful degradation):
```pml
var !result collect all (TYPE) with (CONDITION) for CONTEXT
^^^ ^^^^^^^ ^^^^^^^ ^^^ ^^^^^^ ^^^^ ^^^^^^^^^^^ ^^^ ^^^^^^^
│   │       │       │   │      │    │           │   │
│   │       │       │   │      │    │           │   └─ Подсветка как identifier
│   │       │       │   │      │    │           └─ Подсветка как keyword (если знаем)
│   │       │       │   │      │    └─ Подсветка как parentheses
│   │       │       │   │      └─ Подсветка как keyword (если знаем)
│   │       │       │   └─ Подсветка как parentheses
│   │       │       └─ Подсветка как keyword (если знаем)
│   │       └─ Подсветка как identifier (неизвестное слово - НЕ ОШИБКА!)
│   └─ Подсветка как variable
└─ Подсветка как keyword (знаем!)

Результат: НЕТ ОШИБОК, только подсветка! ✅
```

---

## 🔧 Уровни валидации

### Уровень 1: Синтаксическая подсветка (Syntax Highlighting)
**Цель:** Раскрасить код как Notepad++
**Ошибки:** НЕТ
**Что делаем:**
- Распознаём известные keywords → цвет keyword
- Распознаём переменные (`!var`, `!!var`) → цвет variable
- Распознаём методы (`.method`) → цвет method
- Распознаём строки, числа → соответствующие цвета
- **Неизвестные слова → цвет identifier (БЕЗ ОШИБКИ!)**

**Инструменты:** TextMate Grammar + Semantic Tokens

### Уровень 2: Мягкий парсинг (Soft Parsing)
**Цель:** Понять структуру для IntelliSense
**Ошибки:** Только критичные (несбалансированные скобки, и т.д.)
**Что делаем:**
- Распознаём блоки: `if/endif`, `do/enddo`, `define/endmethod`
- Распознаём известные паттерны: `var !x = value`
- **Неизвестные конструкции → пропускаем как expression**
- Показываем outline (методы, объекты)

**Инструменты:** AST Parser с error recovery

### Уровень 3: Семантическая валидация (Semantic Validation) - ОПЦИОНАЛЬНО
**Цель:** Проверить типы, существование методов
**Ошибки:** Warnings, не Errors
**Включается:** Через настройки (`pml.validation.level: strict`)
**Что делаем:**
- Type checking (если известны типы)
- Проверка существования методов
- Array[0] detection

**По умолчанию:** ВЫКЛЮЧЕНО или только warnings

---

## 📋 Конкретная реализация

### Парсер: Error Recovery

```typescript
// parser.ts
private parseStatement(): Statement | null {
    this.skipTrivia();

    if (this.isAtEnd()) return null;

    // Known constructs
    if (this.check(TokenType.IF)) return this.parseIfStatement();
    if (this.check(TokenType.DO)) return this.parseDoStatement();
    if (this.check(TokenType.VAR)) return this.parseVarStatement();

    // Unknown construct - DON'T ERROR!
    // Just parse as generic expression statement
    return this.parseUnknownStatement();
}

private parseUnknownStatement(): Statement {
    // Consume tokens until we hit a known delimiter
    const tokens: Token[] = [];

    while (!this.isAtEnd() &&
           !this.check(TokenType.NEWLINE) &&
           !this.check(TokenType.ENDIF) &&
           !this.check(TokenType.ENDDO)) {
        tokens.push(this.advance());
    }

    // Return as "UnknownStatement" - NO ERROR!
    return {
        type: 'UnknownStatement',
        tokens,
        range: this.createRange(0, this.current - 1)
    };
}
```

### Diagnostics: Опциональная строгость

```typescript
// diagnosticsManager.ts
export class DiagnosticsManager {
    private validationLevel: 'off' | 'syntax' | 'semantic' | 'strict';

    constructor(config: DiagnosticConfig) {
        this.validationLevel = config.level || 'syntax';
    }

    public diagnose(ast: Program): Diagnostic[] {
        const diagnostics: Diagnostic[] = [];

        // Level 1: Syntax errors (always check)
        if (this.validationLevel !== 'off') {
            diagnostics.push(...this.checkSyntax(ast));
        }

        // Level 2: Semantic warnings (opt-in)
        if (this.validationLevel === 'semantic' || this.validationLevel === 'strict') {
            diagnostics.push(...this.checkSemantics(ast));
        }

        // Level 3: Strict validation (opt-in)
        if (this.validationLevel === 'strict') {
            diagnostics.push(...this.checkStrict(ast));
        }

        return diagnostics;
    }

    private checkSyntax(ast: Program): Diagnostic[] {
        const errors: Diagnostic[] = [];

        // Only CRITICAL errors:
        // - Unbalanced parentheses/brackets
        // - Missing endif/enddo/endmethod
        // - Invalid string literals

        return errors;
    }

    private checkSemantics(ast: Program): Diagnostic[] {
        const warnings: Diagnostic[] = [];

        // Semantic checks as WARNINGS:
        // - Array[0] detection
        // - Undefined variable usage
        // - Unknown method calls

        return warnings;
    }
}
```

### Settings.json

```json
{
    "pml.validation.level": "syntax",  // off | syntax | semantic | strict
    "pml.validation.arrayIndexZero": "warning",  // off | warning | error
    "pml.validation.unknownKeywords": "off",     // ← ВАЖНО!
    "pml.validation.unknownMethods": "off",
    "pml.validation.typeChecking": "off"
}
```

---

## 🎨 Подсветка синтаксиса

### TextMate Grammar (базовая подсветка)

Уже работает! В `syntaxes/pml.tmLanguage.json`:

```json
{
    "patterns": [
        {
            "name": "keyword.control.pml",
            "match": "\\b(if|then|else|elseif|endif|do|enddo|var|for|while)\\b"
        },
        {
            "name": "keyword.other.pml",
            "match": "\\b(collect|all|with|using|at|compose|space)\\b"
        },
        {
            "comment": "Unknown words - just highlight as identifier, NO ERROR",
            "name": "entity.name.function.pml",
            "match": "\\b[a-zA-Z_][a-zA-Z0-9_]*\\b"
        }
    ]
}
```

**Важно:** Неизвестные слова получают просто цвет identifier, БЕЗ подчёркивания!

### Semantic Tokens (умная подсветка)

Только для **известных** конструкций:

```typescript
// semanticTokensProvider.ts
export class SemanticTokensProvider {
    public provide(document: TextDocument): SemanticToken[] {
        const tokens: SemanticToken[] = [];
        const ast = this.parser.parse(document.getText());

        for (const node of ast.body) {
            // Only highlight what we KNOW
            if (node.type === 'MethodDefinition') {
                tokens.push({
                    line: node.range.start.line,
                    char: node.range.start.character,
                    length: node.name.length,
                    tokenType: 'method',
                    tokenModifiers: ['definition']
                });
            }

            if (node.type === 'VariableDeclaration') {
                tokens.push({
                    line: node.range.start.line,
                    char: node.range.start.character,
                    length: node.name.length,
                    tokenType: node.scope === 'global' ? 'variable.global' : 'variable.local',
                    tokenModifiers: []
                });
            }

            // UnknownStatement - SKIP! No highlighting, no errors!
            if (node.type === 'UnknownStatement') {
                continue; // Just ignore it
            }
        }

        return tokens;
    }
}
```

---

## 🚀 Поэтапное внедрение

### Phase 2.1: Добавляем известные keywords (БЕЗ строгой валидации)

```typescript
// tokens.ts - просто добавляем в список
export enum TokenType {
    // ... existing

    // PML1 keywords - добавляем, но НЕ требуем их парсинг!
    COLLECT = 'COLLECT',
    ALL = 'ALL',
    WITH = 'WITH',
    FOR = 'FOR',
    USING = 'USING',
    AT = 'AT',
    COMPOSE = 'COMPOSE',
    SPACE = 'SPACE',
}

export const KEYWORDS: Record<string, TokenType> = {
    // ... existing

    // PML1 - просто распознаём для подсветки
    'collect': TokenType.COLLECT,
    'all': TokenType.ALL,
    'with': TokenType.WITH,
    'for': TokenType.FOR,  // может быть и в других контекстах!
    'using': TokenType.USING,
    'at': TokenType.AT,
    'compose': TokenType.COMPOSE,
    'space': TokenType.SPACE,
};
```

**Важно:** Keyword распознаётся, но parser НЕ обязан его понимать!

### Phase 2.2: Parser - graceful fallback

```typescript
// parser.ts
private parseVarStatement(): Statement {
    this.consume(TokenType.VAR, "Expected 'var'");

    // Parse variable name
    const varToken = this.consume(TokenType.LOCAL_VAR, "Expected variable");
    const varName = varToken.value.substring(1);

    // Check for known patterns
    if (this.check(TokenType.ASSIGN)) {
        // var !x = value
        return this.parseAssignment(varName);
    }

    if (this.check(TokenType.COLLECT)) {
        // var !x collect ...
        // TODO: implement when ready
        // For now - parse as unknown
        return this.parseUnknownVarStatement(varName);
    }

    if (this.check(TokenType.COMPOSE)) {
        // var !x compose ...
        // TODO: implement when ready
        return this.parseUnknownVarStatement(varName);
    }

    // Unknown pattern - DON'T ERROR!
    return this.parseUnknownVarStatement(varName);
}

private parseUnknownVarStatement(varName: string): Statement {
    // Consume everything until end of statement
    const tokens: Token[] = [];
    while (!this.isAtEnd() && !this.check(TokenType.NEWLINE)) {
        tokens.push(this.advance());
    }

    return {
        type: 'VariableDeclaration',
        name: varName,
        scope: 'local',
        initializer: {
            type: 'UnknownExpression',
            tokens
        }
    };
}
```

### Phase 2.3: Постепенно добавляем парсинг

Когда будете готовы:

```typescript
private parseCollectExpression(): Expression {
    this.consume(TokenType.COLLECT, "Expected 'collect'");

    // collect all ...
    if (this.check(TokenType.ALL)) {
        this.advance();
        // ... parse collect all
    }

    // ... и так далее
}
```

---

## 📊 Результат

### Что видит пользователь:

#### Код с известными конструкциями:
```pml
var !x = 42              ← Подсветка: var(keyword) !x(variable) = 42(number)
if !x gt 10 then         ← Подсветка: if/then(keyword) !x(variable) gt(operator)
    !x = 20              ← Подсветка, IntelliSense работает
endif                    ← Подсветка
```
**Ошибки:** НЕТ
**IntelliSense:** Работает полностью

#### Код с неизвестными конструкциями:
```pml
var !result collect all (pipe equi) with (name eq 'TEST') for !!ce
    ^^^ ^^^^^^^ ^^^^^^^ ^^^ ^^^^^^^^ ^^^^ ^^^^^^^^^^^^^^^^ ^^^ ^^^^
    │   │       │       │   │        │    │                │   │
    │   │       │       │   │        │    │                │   └─ identifier
    │   │       │       │   │        │    │                └─ keyword (знаем!)
    │   │       │       │   │        │    └─ identifier
    │   │       │       │   │        └─ keyword (знаем!)
    │   │       │       │   └─ identifier
    │   │       │       └─ keyword (знаем!)
    │   │       └─ keyword (знаем!)
    │   └─ variable
    └─ keyword
```
**Ошибки:** НЕТ (!)
**IntelliSense:** Частично работает (переменные, keywords)
**Outline:** Показывает переменную `!result`

#### Код с РЕАЛЬНЫМИ ошибками:
```pml
if !x gt 10 then
    !x = 20
-- endif забыли!
do !i from 1 to 10
    ...
```
**Ошибки:** ДА - "Missing endif" (критичная ошибка структуры!)

---

## ✅ Итого: Стратегия

### 1. **Подсветка синтаксиса:** ВСЁ
   - TextMate Grammar распознаёт всё
   - Неизвестные слова → просто identifier цвет
   - **Ошибок НЕТ**

### 2. **Парсинг:** Только известное
   - Известные конструкции → полный AST
   - Неизвестные → UnknownExpression/UnknownStatement
   - **Ошибок НЕТ (кроме критичных)**

### 3. **Валидация:** Опциональная
   - По умолчанию: только критичные ошибки структуры
   - Опционально: type checking, unknown method warnings
   - **Пользователь контролирует строгость**

### 4. **IntelliSense:** Работает на известном
   - Completion для переменных, методов
   - Hover для известных keywords
   - Signature help где возможно

---

## 🎯 Преимущества подхода

✅ **Не раздражаем пользователя** ложными ошибками
✅ **Постепенное развитие** - добавляем поддержку по мере готовности
✅ **Как Notepad++** - подсветка без излишней строгости
✅ **IntelliSense работает** там где можем
✅ **Пользователь доволен** - код красивый, ошибок мало

---

**Last Updated:** 2025-10-19
**Status:** Рекомендуемая стратегия для реализации
