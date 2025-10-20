-- ============================================
-- Примеры документирования методов PML
-- ============================================

-- Простой метод с базовой документацией
-- @param !somevalue - числовое значение для проверки
-- @return BOOLEAN - true если значение положительное
define method .isPositive(!somevalue is real)

    if (!somevalue gt 0) then
        return TRUE
    else
        return FALSE
    endif

endmethod

-- Метод с полной документацией
-- Вычисляет сумму элементов массива
--
-- @param !list - массив чисел (ARRAY)
-- @return REAL - сумма всех элементов
-- @example !total = .calculateSum(!myNumbers)
-- @author Your Name
-- @since 1.0.0
define method .calculateSum(!list is array)

    !sum = 0

    do !item values !list
        !sum = !sum + !item
    enddo

    return !sum

endmethod

-- Deprecated метод
-- @deprecated Используй .getNameNew() вместо этого
-- @param !element - элемент БД
-- @return STRING - имя элемента
define method .getNameOld(!element)

    return !element.query(|NAME|)

    -- @type STRING
    !name = !!ce.name.String()
    !name.Digits()

endmethod

-- Callback метод для формы
-- Обработчик нажатия кнопки OK
-- @form !!MyForm
-- @callback okCall
-- @return BOOLEAN - true если валидация успешна
define method .onOKClick()

    if (!this.validateData()) then
        |Data validated successfully|.output()
        return TRUE
    else
        |Validation failed|.alert()
        return FALSE
    endif

endmethod

-- Метод работы с БД
-- Собирает все трубы по фильтру
-- @param !filter - фильтр для collectallfor (STRING)
-- @dbref PIPE элементы
-- @return ARRAY - массив DBREF на трубы
-- @example !pipes = .getAllPipes(|BORE gt 100|)
-- @see .getPipesBySpec()
define method .getAllPipes(!filter)

    !types  = |PIPE|
    !place  = !!ce
    !result = !!collectallfor(!types, !filter, !place)
    return !result

endmethod

-- Тестирование hover подсказок
define method .testHover()

    -- Наведи мышь на вызовы методов ниже:
    !positive = .isPositive(42)
    !sum      = .calculateSum(!myList)
    !name     = .getNameOld(!element)
    !pipes    = .getAllPipes(|BORE gt 50|)

    do !i from !sequence - 1 to 1 by -1
        skip if(!lBores[!i].eq(''))  ← без отступа
        !this.arriveBore = !lBores[!i].bore()
        break  ← без отступа
    enddo

DRAWLIST

endmethod

