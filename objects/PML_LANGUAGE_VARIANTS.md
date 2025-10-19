# PML Language Variants

**ВАЖНО:** PML имеет две ветки синтаксиса - PML1 и PML2

---

## 📚 Обзор

PML (Programmable Macro Language) для AVEVA E3D существует в двух вариантах:

1. **PML1** - "человекочитаемый" декларативный синтаксис
2. **PML2** - ООП-подобный процедурный синтаксис

**ВАЖНО:** PML2 функции часто являются обёртками над PML1 кодом!

---

## 🔄 PML1 vs PML2

### Пример 1: Collect/For

#### PML1 (декларативный):
```pml
var !allpipes collect all ( pipe equi ) with ( matchwild ( name, '*COPY*') ) for ce
```

**Характеристики:**
- "Читается как предложение"
- Ключевые слова: `collect`, `all`, `with`, `for`
- Больше похоже на SQL или естественный язык
- Порядок слов важен

#### PML2 (процедурный):
```pml
!allpipes = !!collectallfor('pipe equi', |matchwild ( name, '*COPY*')|, !!ce )
```

**Характеристики:**
- Функциональный стиль (вызов функции)
- Глобальная функция `!!collectallfor`
- Параметры в скобках
- **Это обёртка над PML1 кодом!**

---

## 🎯 Стратегия для расширения

### Что нужно поддерживать:

#### 1. **PML1 Keywords (декларативные):**
```pml
var !result collect <expression>
var !result collect all <type> with <condition> for <context>
do !item values !collection
```

**Ключевые слова:**
- `collect`, `all`, `with`, `for`
- `values`, `index`, `from`, `to`, `by`
- `if`, `then`, `else`, `elseif`, `endif`
- `do`, `enddo`, `while`
- `handle`, `elsehandle`, `endhandle`

#### 2. **PML2 Functions (глобальные обёртки):**
```pml
!!collectallfor(type, condition, context)
!!collectallwith(type, condition)
```

**Характеристики:**
- Префикс `!!` (глобальные функции)
- Обычно UPPERCASE
- Принимают параметры как строки или выражения

#### 3. **Смешанный синтаксис (часто встречается):**
```pml
var !result collect all (pipe equi) with (!diameter eq 100) for !!currentElement

-- Или

!pipes = !!collectallfor('pipe equi', |OWNER eq '/PUMP-101'|, !!ce)
do !pipe values !pipes
    !name = !pipe.name
enddo
```

---

## 🛠️ Стратегия парсинга

### Уровень 1: Базовые конструкции (✅ ГОТОВО)
- [x] Variables: `!local`, `!!global`
- [x] Methods: `.method()`
- [x] Keywords: `if`, `then`, `else`, `do`, `enddo`, `var`, `by`
- [x] Operators: `eq`, `ne`, `neq`, `and`, `or`, `not`

### Уровень 2: PML1 Extensions (⏳ TODO)
- [ ] `collect` keyword и его варианты
- [ ] `all` keyword
- [ ] `with` keyword (условия)
- [ ] `for` keyword (контекст)
- [ ] `using` keyword
- [ ] `at` keyword

**Пример:**
```pml
var !allpipes collect all ( pipe equi ) with ( matchwild ( name, '*COPY*') ) for ce
    ^          ^       ^    ^             ^    ^                                  ^
    var      collect  all  (type)       with  (condition)                       for context
```

### Уровень 3: PML2 Wrapper Functions (⏳ TODO)
- [ ] Распознавание глобальных функций `!!functionName()`
- [ ] Hover documentation для wrapper functions
- [ ] Сигнатуры параметров

**Известные PML2 wrappers:**
```pml
!!collectallfor(type, condition, context)
!!collectallwith(type, condition)
!!query(dbref, attribute)
!!create(type, properties)
```

### Уровень 4: Специальные конструкции (⏳ TODO)
- [ ] `compose` - построение строк
- [ ] `space` - разделители
- [ ] `$` prefix - специальные переменные ($!var, $/string)
- [ ] `|expression|` - выражения в pipe syntax

---

## 📋 Примеры реального кода

### Collect Examples

#### Вариант 1: Simple collect
```pml
var !pipes collect all (pipe equi)
```

#### Вариант 2: With condition
```pml
var !pipes collect all (pipe equi) with (OWNER eq '/PUMP-101')
```

#### Вариант 3: With wildcard
```pml
var !pipes collect all (pipe equi) with (matchwild(name, '*COPY*'))
```

#### Вариант 4: For context
```pml
var !pipes collect all (pipe equi) with (OWNER eq '/PUMP-101') for !!currentElement
```

#### Вариант 5: PML2 wrapper
```pml
!pipes = !!collectallfor('pipe equi', |OWNER eq '/PUMP-101'|, !!ce)
```

### Compose Examples

#### Вариант 1: Basic compose
```pml
var !message compose |Hello| space |World|
-- Result: |Hello World|
```

#### Вариант 2: With variables
```pml
var !text compose |Value: | $!count
-- Result: |Value: 42| (if !count = 42)
```

#### Вариант 3: Multiple parts
```pml
var !dprt compose space $!indxA |END|
```

### Special Prefix Examples

#### $ prefix (substitute/evaluate):
```pml
!text = |The count is: $!count|
-- $!count заменяется на значение переменной

$!variableName  -- подстановка переменной
$/ATTRIBUTE     -- доступ к атрибуту
```

---

## 🎯 Приоритизация поддержки

### 🔴 КРИТИЧНО (Phase 2):
1. ✅ Базовые keywords (if/do/var/by/neq) - ГОТОВО
2. ⏳ `collect`/`all`/`with`/`for` - PML1 декларативный синтаксис
3. ⏳ `compose`/`space` - построение строк
4. ⏳ `$` prefix - подстановка переменных

### 🟡 ВАЖНО (Phase 3):
5. ⏳ PML2 wrapper functions (`!!collectallfor`, etc.)
6. ⏳ `using` keyword
7. ⏳ `at` keyword
8. ⏳ Специальные expression forms

### 🟢 ЖЕЛАТЕЛЬНО (Phase 4):
9. ⏳ Контекстные подсказки для collect
10. ⏳ Валидация типов в collect expressions
11. ⏳ Автодополнение для wrapper functions

---

## 🚨 Ограничения и компромиссы

### Что НЕ получится сделать на 100%:

1. **Динамическая типизация:**
   - PML динамически типизирован
   - Невозможно всегда точно определить тип переменной
   - **Компромисс:** Type inference на 80-90% случаев

2. **Контекстно-зависимый синтаксис:**
   - Некоторые keywords меняют значение в зависимости от контекста
   - Например, `for` может быть и loop, и context specifier
   - **Компромисс:** Эвристический анализ контекста

3. **PML2 обёртки - чёрный ящик:**
   - Wrapper functions скрывают реализацию
   - Невозможно статически проанализировать что внутри
   - **Компромисс:** Документация + signature hints

4. **Смешанный синтаксис:**
   - Код может содержать и PML1, и PML2 в одном файле
   - Трудно определить границы
   - **Компромисс:** Поддержка обоих синтаксисов параллельно

5. **AVEVA Database Context:**
   - Многие операции зависят от состояния БД AVEVA
   - Невозможно валидировать без подключения к E3D
   - **Компромисс:** Базовая валидация синтаксиса, без семантики БД

---

## 💡 Рекомендации для базы знаний

### Формат документации для dual-syntax:

```markdown
### CollectAllFor

**PML1 Syntax:**
```pml
var !result collect all (TYPE) with (CONDITION) for CONTEXT
```

**PML2 Syntax:**
```pml
!result = !!collectallfor('TYPE', |CONDITION|, CONTEXT)
```

**Description:** Collect all elements of TYPE matching CONDITION in CONTEXT.

**Example:**
```pml
-- PML1 style
var !pipes collect all (pipe equi) with (OWNER eq '/PUMP-101') for !!ce

-- PML2 style (wrapper)
!pipes = !!collectallfor('pipe equi', |OWNER eq '/PUMP-101'|, !!ce)
```

**Notes:**
- PML2 `!!collectallfor` is a wrapper around PML1 `collect`
- Both syntaxes produce the same result
- PML1 is more readable, PML2 is more flexible for dynamic parameters
```

---

## 📊 Целевая поддержка

### Реалистичные цели:

| Категория | Целевое покрытие | Статус |
|-----------|------------------|--------|
| Базовый синтаксис (keywords, operators) | 95%+ | ✅ 90% (Phase 1) |
| PML1 декларативный синтаксис | 80-90% | ⏳ 10% |
| PML2 wrapper functions | 70-80% | ⏳ 5% |
| Type inference | 70-80% | ⏳ 40% |
| AVEVA DB validation | 0% (out of scope) | ❌ Not planned |
| Context-sensitive completion | 60-70% | ⏳ 30% |

**Итоговая цель:** 75-85% покрытие языка (это отличный результат для специализированного языка!)

---

## 🔧 План действий

### Немедленно (Phase 2):

1. **Добавить PML1 keywords в парсер:**
   ```typescript
   // tokens.ts
   COLLECT = 'COLLECT',
   ALL = 'ALL',
   WITH = 'WITH',
   FOR = 'FOR',
   USING = 'USING',
   AT = 'AT',
   COMPOSE = 'COMPOSE',
   SPACE = 'SPACE',
   ```

2. **Создать AST nodes для PML1:**
   ```typescript
   export interface CollectStatement extends ASTNode {
       type: 'CollectStatement';
       variable: Identifier;
       collectType: 'all' | 'any';
       elementType: Expression;
       condition?: Expression;
       context?: Expression;
   }
   ```

3. **Добавить парсинг collect:**
   ```typescript
   private parseCollectStatement(): CollectStatement {
       // var !result collect all (type) with (condition) for context
   }
   ```

4. **Документировать в базе знаний:**
   - `objects/keywords.md` - все keywords с обоими синтаксисами
   - `objects/builtin functions.md` - PML2 wrappers

### Позже (Phase 3):

- Semantic analysis для collect
- Context-aware completion
- PML2 wrapper hints

---

**Last Updated:** 2025-10-19
**Status:** Planning document - critical for parser development
**Next Review:** After adding collect/compose support
