# 🏷️ Type Hints для PML

Расширение поддерживает type hints для улучшения автодополнения методов.

---

## Зачем нужны type hints?

**Проблема:**
```pml
!someVar = !!ce.Pressure.string()

!someVar.   ← Расширение не знает что это STRING
```

**Решение:**
```pml
-- @type STRING
!someVar = !!ce.Pressure.string()

!someVar.   ← Покажет ТОЛЬКО STRING методы! ✨
```

---

## Способы указать тип

### Способ 1: @type в комментарии перед переменной (рекомендуется)

```pml
-- @type STRING
!name = !!ce.query(|NAME|)

!name.   ← покажет: UpCase(), LowCase(), Length(), Trim(), etc.
```

### Способ 2: Inline комментарий

```pml
!value = !!ce.Pressure.string()  -- STRING

!value.   ← покажет только STRING методы
```

### Способ 3: Автоматическое определение

Расширение **автоматически** определяет тип в простых случаях:

```pml
!str = STRING()       ← автоматически STRING
!str = |text|         ← автоматически STRING  
!str = 'text'         ← автоматически STRING
!str = "text"         ← автоматически STRING

!num = REAL()         ← автоматически REAL
!num = 42             ← автоматически REAL
!num = 3.14           ← автоматически REAL

!flag = BOOLEAN()     ← автоматически BOOLEAN
!flag = TRUE          ← автоматически BOOLEAN
!flag = FALSE         ← автоматически BOOLEAN

!arr = ARRAY()        ← автоматически ARRAY

!result = !var.string()  ← автоматически STRING
```

---

## Поддерживаемые типы

| Тип | Методы | Примеры |
|-----|---------|---------|
| **STRING** | 47 методов | .UpCase(), .LowCase(), .Length(), .Trim(), .Split(), etc. |
| **REAL** | 6 методов | .Abs(), .Round(), .Floor(), .Ceiling(), .String() |
| **ARRAY** | 9 методов | .Append(), .Size(), .Remove(), .First(), .Last(), .Evaluate() |
| **DBREF** | 2 метода | .Query(), .String() |

---

## Примеры использования

### STRING методы

```pml
-- @type STRING
!text = !!ce.query(|NAME|)

!upper = !text.UpCase()              -- В ВЕРХНИЙ РЕГИСТР
!lower = !text.LowCase()             -- в нижний регистр
!len = !text.Length()                -- длина строки
!trimmed = !text.Trim()              -- удалить пробелы
!parts = !text.Split(|_|)            -- разбить на массив
!replaced = !text.Replace(|old|, |new|)  -- замена подстроки
```

### REAL методы

```pml
!value = 42.7  -- REAL

!abs = !value.Abs()                  -- модуль
!rounded = !value.Round()            -- округление
!ceiling = !value.Ceiling()          -- округление вверх
!floor = !value.Floor()              -- округление вниз
!str = !value.String()               -- конвертация в STRING
```

### ARRAY методы

```pml
!list = ARRAY()  -- ARRAY

!list.Append(|item1|)                -- добавить элемент
!list.AppendArray(!otherList)        -- добавить массив
!count = !list.Size()                -- размер массива
!list.Remove(|item1|)                -- удалить элемент
!first = !list.First()               -- первый элемент
!last = !list.Last()                 -- последний элемент
!isEmpty = !list.Empty()             -- пустой?
```

### DBREF методы

```pml
!element = !!ce  -- DBREF (Current Element)

!name = !element.Query(|NAME|)       -- запрос атрибута
!type = !element.Query(|TYPE|)
!bore = !element.Query(|BORE|)
```

---

## Когда тип неизвестен

Если расширение не может определить тип, оно покажет **все методы** со всех типов:

```pml
!unknown = !someComplexExpression()

!unknown.   ← покажет все методы: [STRING] UpCase(), [REAL] Abs(), [ARRAY] Size(), etc.
```

**Метка `[TYPE]`** показывает для какого типа метод.

---

## Best Practices

### ✅ Хорошо:

```pml
-- Получает имя элемента
-- @type STRING
!elementName = !!ce.query(|NAME|)

!upperName = !elementName.UpCase()
```

### ✅ Тоже хорошо (авто-определение):

```pml
!name = STRING()  -- автоматически определится как STRING
!name = !element.query(|NAME|).string()  -- тоже определится
```

### ⚠️ Работает, но покажет все методы:

```pml
!result = !someMethod()  -- тип неизвестен
!result.   ← покажет ВСЕ методы со всех типов
```

### ✅ Исправлено с type hint:

```pml
-- @type STRING
!result = !someMethod()

!result.   ← покажет только STRING методы ✨
```

---

## Примеры из твоего случая

### Вариант А: С type hint (точные подсказки)

```pml
-- @type STRING
!pressure = !!ce.Pressure.string()

!pressure.   
```
→ Покажет: **только STRING методы** (UpCase, LowCase, Length, etc.)

### Вариант Б: Без type hint (все методы)

```pml
!pressure = !!ce.Pressure.string()

!pressure.   
```
→ Покажет: **все методы** с метками `[STRING]`, `[REAL]`, `[ARRAY]`

---

## Расширение type hints

В будущем можно добавить в `@param`:

```pml
-- @param !name STRING - имя элемента
-- @param !count REAL - количество элементов
define method .processData(!name, !count)
    !name.    ← автоматически определит STRING
    !count.   ← автоматически определит REAL
endmethod
```

---

**Протестируй после установки v0.3.0!** 🚀

**Создай файл:**
```pml
-- @type STRING
!test = !!ce.query(|NAME|)

!test.  ← нажми Ctrl+Space и увидишь STRING методы!
```

