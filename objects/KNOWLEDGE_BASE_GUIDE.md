# 📖 Гайд по заполнению базы знаний

Краткая инструкция для заполнения файлов в `objects/`

---

## 🎯 Что заполнять

### Приоритет 1 (критично):
1. ✅ **array object.md** - ГОТОВО (48 методов)
2. ✅ **string object.md** - ГОТОВО (69 методов)
3. ⏳ **keywords.md** - **ОЧЕНЬ ВАЖНО** для парсера
4. ⏳ **builtin functions.md** - **ВАЖНО** (compose, space, writefile)

### Приоритет 2 (важно):
5. ⏳ **real object.md**
6. ⏳ **boolean object.md**
7. ⏳ **dbref object.md**

### Приоритет 3 (желательно):
8. ⏳ **operators.md**
9. ⏳ Другие специальные типы

---

## 📝 Формат файлов

### Для Object types (ARRAY, STRING, REAL, etc.):

```markdown
# {TYPE} Object

Brief description of the type.

**Total Methods:** X

---

## Quick Reference

| Name | Result | Purpose |
|------|--------|---------|
| MethodName(PARAM_TYPE param) | RETURN_TYPE | What it does |
| AnotherMethod() | RETURN_TYPE | What it does |

---

## Detailed Documentation

### MethodName(param)

Description of what the method does.

**Signature:** `MethodName(param: PARAM_TYPE) → RETURN_TYPE`

**Parameters:**
- `param` (PARAM_TYPE) - Description

**Example:**
```pml
!example = |value|
!result = !example.MethodName(42)  -- Returns: expected result
```

**Notes:**
- Important notes or warnings
```

### Для builtin functions:

```markdown
# PML Builtin Functions

Global functions available in PML.

---

## Quick Reference

| Function | Signature | Returns | Purpose |
|----------|-----------|---------|---------|
| compose | compose part1 part2 ... | STRING | Concatenate parts into string |
| space | space | STRING | Returns space character |
| writefile | writefile !unit text | - | Write to file |

---

## Detailed Documentation

### compose

Concatenate multiple parts into a single string.

**Syntax:**
```pml
var !result compose part1 part2 part3 ...
-- or
!result = compose part1 part2
```

**Example:**
```pml
var !message compose |Hello| space |World|
-- Result: |Hello World|

var !text compose |Value: | $!count
-- If !count = 42, Result: |Value: 42|
```

**Notes:**
- Parts can be strings, variables, or expressions
- Use `space` keyword for space character
- Use `$` prefix to substitute variable values
```

### Для keywords:

```markdown
# PML Keywords

Complete list of PML language keywords with examples.

---

## Control Flow Keywords

### if / then / else / elseif / endif

Conditional execution.

**Syntax:**
```pml
if condition then
    -- code
elseif another_condition then
    -- code
else
    -- code
endif
```

**Example:**
```pml
if !count gt 10 then
    |Large|.output()
elseif !count gt 5 then
    |Medium|.output()
else
    |Small|.output()
endif
```

---

## PML1 Declarative Keywords

### collect / all / with / for

Collect elements from database.

**PML1 Syntax:**
```pml
var !result collect all (TYPE) with (CONDITION) for CONTEXT
```

**PML2 Syntax (wrapper):**
```pml
!result = !!collectallfor('TYPE', |CONDITION|, CONTEXT)
```

**Example:**
```pml
-- PML1 style
var !pipes collect all (pipe equi) with (OWNER eq '/PUMP-101') for !!ce

-- PML2 style
!pipes = !!collectallfor('pipe equi', |OWNER eq '/PUMP-101'|, !!ce)
```

**Notes:**
- PML2 `!!collectallfor` is a wrapper over PML1 collect
- Both syntaxes produce identical results
- See: PML_LANGUAGE_VARIANTS.md for more details

---

### compose / space

String composition.

**Syntax:**
```pml
var !result compose part1 space part2
```

**Example:**
```pml
var !message compose |Hello| space |World|
-- Result: |Hello World|

var !dprt compose space $!indxA |END|
-- Substitutes !indxA value and appends |END|
```
```

---

## ⚠️ Важные моменты

### 1. PML имеет 2 синтаксиса:

Обязательно указывайте **оба варианта**, где применимо:

**PML1 (декларативный):**
```pml
var !pipes collect all (pipe equi) with (name eq 'TEST')
```

**PML2 (процедурный обёртка):**
```pml
!pipes = !!collectallfor('pipe equi', |name eq 'TEST'|)
```

### 2. Индексация с 1:

PML использует **1-based индексацию**, не 0-based:

```pml
!arr = ARRAY()
!arr.Append(|first|)
!first = !arr[1]  -- ✅ Correct
!wrong = !arr[0]  -- ❌ Error in PML!
```

### 3. Специальные префиксы:

- `!var` - local variable
- `!!var` - global variable
- `.method` - method call
- `$!var` - substitute variable value
- `$/ATTR` - attribute access

### 4. String literals:

PML поддерживает 3 типа кавычек:

```pml
!str1 = |pipe syntax|
!str2 = 'single quotes'
!str3 = "double quotes"
```

---

## 📚 Примеры для вдохновения

### Хороший пример (string object.md):

```markdown
#### UpCase()

Convert string to upper case.

**Signature:** `UpCase() → STRING`

**Example:**
```pml
!name = |hello world|
!upper = !name.UpCase()  -- Returns: |HELLO WORLD|
```
```

### Хороший пример с overloads (array object.md):

```markdown
#### From(index, n)

Copy sub-array of n elements starting at index.

**Signature:** `From(index: REAL, n: REAL) → ARRAY`

---

#### From(index)

Copy sub array starting at index to end of array.

**Signature:** `From(index: REAL) → ARRAY`
```

---

## 🎯 Что НЕ нужно описывать

### ❌ Не документируем:

1. **Внутренние детали AVEVA E3D** - мы делаем language support, не E3D документацию
2. **Database-specific логику** - валидация БД вне scope проекта
3. **Deprecated методы** - если известно, что метод устарел, можно пропустить (или пометить)
4. **Экспериментальные фичи** - только стабильный синтаксис

### ✅ Документируем:

1. **Синтаксис и сигнатуры** - для IntelliSense
2. **Базовые примеры** - для понимания использования
3. **Важные замечания** - особенности языка (1-based indexing, и т.д.)
4. **Оба синтаксиса** - PML1 и PML2 где применимо

---

## 🚀 Быстрый старт

### Для keywords.md:

1. Открыть [PML_LANGUAGE_VARIANTS.md](PML_LANGUAGE_VARIANTS.md)
2. Взять примеры оттуда
3. Добавить в keywords.md с описанием
4. Обязательно указать оба синтаксиса (PML1 и PML2)

### Для builtin functions.md:

1. Список функций:
   - `compose` - конкатенация строк
   - `space` - символ пробела
   - `writefile` - запись в файл
   - `!!collectallfor` - PML2 wrapper для collect
   - и другие глобальные функции

2. Формат: функция + пример + примечания

### Для real object.md / boolean object.md:

1. Использовать формат из array object.md
2. Таблица методов + детальное описание важных
3. Примеры использования

---

## 💡 Советы

1. **Не стремитесь к 100% покрытию** - цель 75-85% это отлично!
2. **Примеры важнее текста** - один хороший пример лучше страницы описания
3. **Копируйте структуру** - из array object.md или string object.md
4. **Оба синтаксиса** - всегда указывайте PML1 и PML2 где есть
5. **Коммитьте часто** - не обязательно делать всё за раз

---

## 📊 Прогресс заполнения

Обновляйте этот список по мере работы:

- [x] array object.md - 48 methods ✅
- [x] string object.md - 69 methods ✅
- [ ] keywords.md - 0/~40 keywords
- [ ] builtin functions.md - 0/~20 functions
- [ ] real object.md - 0/~15 methods
- [ ] boolean object.md - 0/~5 methods
- [ ] dbref object.md - 0/~15 methods
- [ ] operators.md - 0/~15 operators

---

**Вопросы?** Пишите в [Issues](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/issues)

**Last Updated:** 2025-10-19
