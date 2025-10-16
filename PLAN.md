# План создания расширения VS Code для PML (AVEVA E3D)

## Обзор проекта

Создаем расширение VS Code для языка PML (Programmable Macro Language) AVEVA E3D с поддержкой:
- Подсветки синтаксиса
- Автоформатирования
- Snippets (шаблоны кода)
- Проверки ошибок

---

## Этап 1: Базовая структура расширения ✅

### Файлы:
- [x] `package.json` - манифест расширения
- [x] `README.md` - описание расширения
- [x] `CHANGELOG.md` - история изменений
- [x] `.vscodeignore` - файлы для исключения при публикации
- [x] `language-configuration.json` - базовые настройки языка

### Что делать:
1. Установить Node.js (если нет): https://nodejs.org/
2. Установить VS Code Extension Manager:
   ```bash
   npm install -g @vscode/vsce yo generator-code
   ```
3. Файлы уже созданы в папке `vscode-pml-extension`

---

## Этап 2: Подсветка синтаксиса (TextMate Grammar) ✅

### Файлы:
- [x] `syntaxes/pml.tmLanguage.json` - правила подсветки

### Ключевые слова PML для подсветки:
- **Управление**: `if`, `then`, `else`, `elseif`, `endif`, `do`, `enddo`, `break`, `return`
- **Циклы**: `do`, `while`, `for`, `to`, `from`, `values`, `index`, `enddo`
- **Определения**: `define`, `method`, `endmethod`, `object`, `endobject`, `form`, `frame`, `exit`
- **Типы**: `STRING`, `REAL`, `BOOLEAN`, `ARRAY`
- **Операторы**: `and`, `or`, `not`, `eq`, `ne`, `gt`, `lt`, `ge`, `le`
- **Специальные**: `setup`, `using`, `namespace`

### Что поддерживается:
- Комментарии: `--` и `$*`
- Строки: `|текст|`
- Переменные: `!variable`, `!!variable`
- Числа: `123`, `45.67`
- Методы: `.methodName()`

---

## Этап 3: Автоформатирование ✅

### Файлы:
- [x] `src/formatter.ts` - логика форматирования (TypeScript)
- [x] `package.json` - команда форматирования

### Правила форматирования:
1. ✅ Удаление множественных пустых строк
2. ✅ Форматирование блоков `method`
3. ✅ Форматирование блоков `form`/`frame` с `exit`
4. ✅ Игнорирование комментариев (`--`, `$*`)

**Использование:** Shift+Alt+F или правый клик → Format Document

---

## Этап 4: Snippets (Шаблоны кода) ✅

### Файлы:
- [x] `snippets/pml.json` - шаблоны кода (35+ шаблонов)

### Добавленные snippets:
**Базовые:**
- `method`, `object`, `if`, `try` — определения
- `dovalues`, `doindex`, `dofromto` — циклы
- `form`, `frame` — интерфейс

**Типы данных:**
- `str`, `real`, `bool`, `array` — переменные
- `var`, `gvar` — объявления

**UI элементы:**
- `button`, `textfield`, `toggle`, `optionlist`

**Функции:**
- `out`, `alert`, `query` — вывод/запросы
- `fileread`, `filewrite` — работа с файлами
- `collectallfor`, `evaluate` — работа с БД
- `progress`, `callback`, `member` — прочее

**Использование:** Начни печатать префикс и нажми Tab

---

## Этап 5: Проверка ошибок (Diagnostics) ✅

### Файлы:
- [x] `src/diagnostics.ts` - проверка кода

### Реализованные проверки:
✅ Незакрытые блоки:
  - `method`/`endmethod`
  - `object`/`endobject`
  - `if`/`endif`
  - `do`/`enddo`
  - `form`/`frame`/`exit`
  - `handle`/`endhandle`

✅ Отсутствие скобок `()` в определениях методов

✅ Использование глобальных переменных (предупреждения)

**Работает в реальном времени** при редактировании кода!

---

## Этап 6: Автодополнение (IntelliSense) ✅

### Файлы:
- [x] `src/completion.ts` - провайдер автодополнения

### Что дополняется:
✅ Ключевые слова PML
✅ Встроенные функции (collectallfor, query, output и т.д.)
✅ Типы данных (STRING, REAL, BOOLEAN, ARRAY и т.д.)
✅ Глобальные переменные (!!ce, !!FMSYS и т.д.)
✅ Атрибуты AVEVA E3D (NAME, TYPE, BORE, PSPEC и т.д.)

**Триггеры:** `.` `!` `|` или Ctrl+Space

---

## Этап 7: Подсказки при наведении (Hover) ✅

### Файлы:
- [x] `src/hover.ts` - провайдер подсказок

### Документация для:
✅ Ключевые слова (method, if, do, handle и т.д.)
✅ Встроенные функции с примерами кода
✅ Типы данных с методами
✅ Глобальные переменные системы
✅ Операторы (eq, ne, gt, lt, and, or и т.д.)

**Использование:** Наведи мышь на любое ключевое слово

---

## Этап 8: Тестирование и публикация ⏳

### Локальное тестирование:
1. ✅ Открыть папку в VS Code
2. ✅ Нажать F5 (запустит Extension Development Host)
3. ✅ Открыть `.pml` файл для тестирования
4. Протестировать все функции:
   - Подсветка синтаксиса
   - Форматирование (Shift+Alt+F)
   - Snippets (Tab после префикса)
   - Автодополнение (Ctrl+Space)
   - Hover подсказки (наведение мыши)
   - Диагностика ошибок (красные подчеркивания)

### Публикация:
1. Создать аккаунт на https://marketplace.visualstudio.com/
2. Упаковать расширение:
   ```bash
   vsce package
   ```
3. Опубликовать:
   ```bash
   vsce publish
   ```

---

## Как добавлять новые возможности

### Добавить новое ключевое слово:
1. Открыть `syntaxes/pml.tmLanguage.json`
2. Найти нужную категорию (keyword.control, keyword.other и т.д.)
3. Добавить слово в массив `patterns`

### Добавить новый snippet:
1. Открыть `snippets/pml.json`
2. Добавить новый блок:
```json
"Имя шаблона": {
  "prefix": "сокращение",
  "body": [
    "строка 1",
    "строка 2 с $1 курсором"
  ],
  "description": "Описание"
}
```

### Добавить новое правило форматирования:
1. Открыть `src/formatter.ts`
2. Добавить логику в функцию `formatDocument()`
3. Пересобрать: `npm run compile`

---

## Структура файлов

```
vscode-pml-extension/
├── package.json                    # Манифест расширения
├── README.md                       # Документация
├── CHANGELOG.md                    # История версий
├── .vscodeignore                   # Исключения при публикации
├── language-configuration.json     # Настройки языка
├── tsconfig.json                   # Конфигурация TypeScript
├── .vscode/
│   ├── launch.json                 # Конфигурация запуска
│   └── tasks.json                  # Задачи сборки
├── syntaxes/
│   └── pml.tmLanguage.json         # Подсветка синтаксиса
├── snippets/
│   └── pml.json                    # 35+ шаблонов кода
├── src/                             # Исходный код (TypeScript)
│   ├── extension.ts                 # Точка входа
│   ├── formatter.ts                 # Форматирование
│   ├── diagnostics.ts               # Проверка ошибок
│   ├── completion.ts                # Автодополнение
│   └── hover.ts                     # Подсказки при наведении
└── out/                             # Скомпилированный JavaScript
    ├── extension.js
    ├── formatter.js
    ├── diagnostics.js
    ├── completion.js
    └── hover.js
```

---

## Полезные ссылки

- VS Code Extension API: https://code.visualstudio.com/api
- TextMate Grammar: https://macromates.com/manual/en/language_grammars
- Publishing Extensions: https://code.visualstudio.com/api/working-with-extensions/publishing-extension
- Example Extensions: https://github.com/microsoft/vscode-extension-samples

---

## Текущий статус

- ✅ Базовая структура создана
- ✅ Подсветка синтаксиса (60+ ключевых слов и функций)
- ✅ Snippets (35+ шаблонов кода)
- ✅ Форматирование (3 правила)
- ✅ Проверка ошибок (5 типов диагностики)
- ✅ Автодополнение (IntelliSense)
- ✅ Hover подсказки (документация)
- ⏳ Тестирование
- ⏳ Публикация

**Следующий шаг:** Запустить расширение (F5) и протестировать все функции!
