-- ============================================
-- Тестирование методов типов и горячих клавиш
-- ============================================

-- Пример 1: Автоопределение типа
!name = !!ce.query(|NAME|)  -- автоматически STRING
!name.   ← попробуй здесь Ctrl+Space

!count = !list.size()       -- автоматически REAL  
!count.   ← попробуй здесь Ctrl+Space

!first = !array.first()     -- автоматически ANY
!first.   ← попробуй здесь Ctrl+Space


-- Пример 2: Циклы (автоопределение)
!collection = !!collectallfor('PIPE', |Lissue eq false|)

do !element values !collection
    !element.   ← автоматически DBREF (Ctrl+Space)
enddo

!stringArray = ARRAY()
!stringArray.append(|item1|)
!stringArray.append(|item2|)

do !item values !stringArray  
    !item.   ← автоматически STRING (Ctrl+Space)
enddo


-- Пример 3: Горячие клавиши для быстрого доступа
-- Поставь курсор в любом месте и нажми:

-- Ctrl+Shift+S → показать STRING методы
-- Ctrl+Shift+R → показать REAL методы  
-- Ctrl+Shift+A → показать ARRAY методы
-- Ctrl+Shift+D → показать DBREF методы
-- Ctrl+Shift+M → показать ВСЕ методы


-- Пример 4: Command Palette
-- Ctrl+Shift+P → "PML: Show STRING Methods"
-- Ctrl+Shift+P → "PML: Show REAL Methods"
-- и т.д.


-- Пример 5: Type hints (опционально, для сложных случаев)
-- @type STRING  
!complexVar = !someComplexExpression()

!complexVar.   ← покажет STRING методы


-- Пример 6: Практические примеры
define method .processElement(!element)
    -- Получаем имя элемента
    !name = !element.query(|NAME|)  -- STRING
    !name.   ← UpCase(), LowCase(), Length(), etc.
    
    -- Получаем тип элемента  
    !type = !element.query(|TYPE|)  -- STRING
    !type.   ← UpCase(), Match(), etc.
    
    -- Получаем диаметр
    !diameter = !element.query(|BORE|).real()  -- REAL
    !diameter.   ← Abs(), Round(), Floor(), etc.
    
    -- Создаем массив для результатов
    !results = ARRAY()  -- ARRAY
    !results.   ← Append(), Size(), First(), etc.
    
    !results.append(!name.upcase())
    !results.append(!type.lowcase())
    
    return !results
endmethod


-- Пример 7: Работа с коллекциями
define method .processCollection(!collection)
    !results = ARRAY()
    
    do !element values !collection
        !name = !element.query(|NAME|)
        !name.   ← STRING методы
        
        !results.append(!name.trim().upcase())
    enddo
    
    !count = !results.size()
    !count.   ← REAL методы
    
    return !results
endmethod
