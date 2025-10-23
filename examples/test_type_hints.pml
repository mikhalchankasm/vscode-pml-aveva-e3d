-- ============================================
-- Примеры Type Hints и методов STRING/REAL/ARRAY
-- ============================================

-- Пример 1: Type hint для STRING
-- @type STRING
!elementName = !!ce.query(|NAME|)

-- Теперь наведи мышь или нажми Ctrl+Space после точки:
!upperName = !elementName.   ← попробуй здесь!


-- Пример 2: Inline type hint
!pressure = !!ce.Pressure.string()  -- STRING

!pressureValue = !pressure.   ← попробуй здесь!


-- Пример 3: Автоопределение типа
!simpleString = |Hello World|  -- автоматически STRING
!number = 42.5                 -- автоматически REAL
!flag = TRUE                   -- автоматически BOOLEAN
!list = ARRAY()                -- автоматически ARRAY

!upper = !simpleString.   ← STRING методы
!rounded = !number.       ← REAL методы
!count = !list.           ← ARRAY методы


-- Пример 4: STRING методы в действии
!text = STRING()
!text = |Some Example Text|

!len = !text.Length()                    -- Длина строки
!upper = !text.UpCase()                  -- В ВЕРХНИЙ РЕГИСТР
!lower = !text.LowCase()                 -- в нижний регистр
!trimmed = !text.Trim()                  -- Удалить пробелы
!parts = !text.Split(| |)                -- Разбить по пробелам
!replaced = !text.Replace(|Example|, |Test|)  -- Замена
!substr = !text.Substring(1, 4)          -- Подстрока
!isEmpty = !text.Empty()                 -- Пустая?
!contains = !text.Match(|Example|)       -- Содержит?
!before = !text.Before(| |)              -- До пробела
!after = !text.After(| |)                -- После пробела


-- Пример 5: REAL методы
!num = 42.7

!abs = !num.Abs()                        -- Модуль
!rounded = !num.Round()                  -- Округление
!ceiling = !num.Ceiling()                -- Вверх
!floor = !num.Floor()                    -- Вниз
!str = !num.String()                     -- В строку


-- Пример 6: ARRAY методы
!myList = ARRAY()

!myList.Append(|item1|)                  -- Добавить
!myList.AppendArray(!otherList)          -- Добавить массив
!size = !myList.Size()                   -- Размер
!myList.Remove(|item1|)                  -- Удалить
!first = !myList.First()                 -- Первый элемент
!last = !myList.Last()                   -- Последний
!isEmpty = !myList.Empty()               -- Пустой?


-- Пример 7: Комбинация с твоим кодом
define method .processElement()
    -- @type STRING
    !pressure = !!ce.Pressure.string()
    
    -- Теперь все методы STRING доступны:
    !trimmed = !pressure.Trim()
    !upper = !pressure.UpCase()
    
    if (!pressure.Empty()) then
        !len = !pressure.Length()
        |Length: | & !len.String().output()
    endif
endmethod


-- Пример 8: Без type hint (покажет все методы)
!unknown = !someComplexMethod()

!unknown.   ← покажет методы для STRING, REAL, ARRAY, DBREF с метками [TYPE]

!this.