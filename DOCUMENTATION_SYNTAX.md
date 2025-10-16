# 📖 Документирование кода PML

## Как писать описания методов

### Базовый формат (JSDoc-style для PML)

```pml
-- Краткое описание метода
-- @param !param1 - описание первого параметра
-- @param !param2 - описание второго параметра
-- @return описание возвращаемого значения
-- @example !result = .myMethod()
define method .myMethod(!param1, !param2)
    -- тело метода
endmethod
```

### Минимальный формат

```pml
-- Краткое описание метода
define method .myMethod()
    -- тело метода
endmethod
```

### Многострочное описание

```pml
-- Длинное описание метода
-- которое занимает несколько строк
-- и содержит детали
--
-- @param !input - входные данные
-- @return результат обработки
define method .processData(!input)
    -- тело метода
endmethod
```

---

## Теги документации

### Основные теги:

| Тег | Назначение | Пример |
|-----|------------|--------|
| `@param` | Описание параметра | `@param !name - имя элемента` |
| `@return` | Что возвращает | `@return массив элементов` |
| `@example` | Пример использования | `@example !list = .getItems()` |
| `@deprecated` | Устаревший метод | `@deprecated Используй .newMethod()` |
| `@author` | Автор | `@author John Doe` |
| `@since` | С какой версии | `@since 2.1.0` |
| `@see` | Ссылка на другой метод | `@see .relatedMethod()` |

### PML специфичные теги:

| Тег | Назначение | Пример |
|-----|------------|--------|
| `@form` | Для callback методов | `@form !!MyForm` |
| `@callback` | Тип callback | `@callback okCall` |
| `@dbref` | Работа с БД | `@dbref PIPE элементы` |
| `@aveva` | AVEVA специфика | `@aveva E3D 2.1+` |

---

## Примеры

### Простой метод

```pml
-- Вычисляет сумму элементов массива
-- @param !list - массив чисел
-- @return сумма всех элементов
define method .calculateSum(!list)
    !sum = 0
    do !item values !list
        !sum = !sum + !item
    enddo
    return !sum
endmethod
```

### Callback метод

```pml
-- Обработчик нажатия кнопки OK
-- @form !!MyForm
-- @callback okCall
-- @return BOOLEAN - true если валидация прошла
define method .onOKButtonClick()
    if (!this.validateInput()) then
        return TRUE
    else
        |Validation failed|.alert()
        return FALSE
    endif
endmethod
```

### Метод с БД

```pml
-- Собирает все трубы из текущего элемента
-- @param !filter - фильтр для collectallfor
-- @dbref PIPE элементы
-- @return массив DBREF на трубы
-- @example !pipes = .getAllPipes(|BORE gt 100|)
define method .getAllPipes(!filter)
    !types = |PIPE|
    !place = !!ce
    return !!collectallfor(!types, !filter, !place)
endmethod
```

### Deprecated метод

```pml
-- Старый метод получения имени
-- @deprecated Используй .getNameNew() вместо этого
-- @param !element - элемент БД
-- @return имя элемента
define method .getNameOld(!element)
    return !element.query(|NAME|)
endmethod
```

---

## Как работает в расширении

### При наведении (Hover):

Наведи мышь на **вызов метода** → увидишь:
```
.calculateSum(!myList)
───────────────────────
Вычисляет сумму элементов массива

Параметры:
  !list - массив чисел

Возвращает:
  сумма всех элементов
```

### В автодополнении (Completion):

Набери `.calc` → увидишь:
```
.calculateSum()
  Вычисляет сумму элементов массива
  Параметры: !list
```

### В Outline (Ctrl+Shift+O):

```
📋 .calculateSum() — Вычисляет сумму элементов
📋 .onOKButtonClick() — Обработчик кнопки OK
📋 .getAllPipes() — Собирает трубы из БД
```

---

## Куда записывать

### Прямо перед методом в коде:

```pml
-- Ваше описание
-- @param ...
-- @return ...
define method .yourMethod()
    ...
endmethod
```

### Для форм - в начале файла:

```pml
-- ============================================
-- Form: !!MyForm
-- Описание: Диалог выбора элементов
-- Author: Your Name
-- Date: 2025-10-14
-- ============================================

setup form !!MyForm dialog docking right
    ...
exit
```

### Для объектов:

```pml
-- Класс для работы с трубопроводами
-- @author Your Name
-- @since 1.0.0
define object PIPEMANAGER
    member .pipes is ARRAY
    
    -- Конструктор
    -- @param !initialPipes - начальный список
    define method .PIPEMANAGER(!initialPipes)
        !this.pipes = !initialPipes
    endmethod
    
endobject
```

---

## Стиль и best practices

### Хорошо:
```pml
-- Получает bore трубы в миллиметрах
-- @param !pipe - DBREF на трубу
-- @return REAL - диаметр в мм
define method .getBoreMM(!pipe)
```

### Плохо:
```pml
-- метод
define method .getBoreMM(!pipe)
```

### Рекомендации:
- ✅ Первая строка - краткое описание (1 строка)
- ✅ Затем детали если нужно
- ✅ Тип параметров в описании (!pipe - DBREF)
- ✅ Примеры использования для сложных методов
- ✅ Упоминай AVEVA атрибуты если релевантно

---

## Следующий шаг

**Сейчас реализую парсинг этих комментариев!**

Расширение будет:
1. Читать комментарии перед `define method`
2. Парсить теги @param, @return, @example
3. Показывать в hover при наведении на вызов метода
4. Показывать в completion при автодополнении

**Продолжить?** 🚀

