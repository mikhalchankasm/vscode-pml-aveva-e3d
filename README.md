# PML for AVEVA E3D - VS Code Extension

Полнофункциональная поддержка языка PML (Programmable Macro Language) для AVEVA E3D (ранее PDMS) в Visual Studio Code.

## Возможности

### 🎨 Подсветка синтаксиса
- **60+ ключевых слов**: `if`, `then`, `do`, `method`, `object`, `handle`, `using`, `namespace` и др.
- **Комментарии**: `--` однострочные и `$*` альтернативный стиль
- **Строки**: `|pipe strings|`, `'single'`, `"double"`
- **Переменные**: `!local`, `!!global` с автоматическим распознаванием
- **Методы**: `.methodName()` с подсветкой вызовов
- **Типы**: `STRING`, `REAL`, `BOOLEAN`, `ARRAY`, `DBREF`, `INTEGER`, `ANY`
- **Встроенные функции**: `query`, `output`, `collectallfor`, `Evaluate`, `FILE`, `ERROR` и др.
- **Константы**: `TRUE`, `FALSE`, `UNSET`, `PI`, `E`, `NULL`
- **Операторы**: `eq`, `ne`, `gt`, `lt`, `ge`, `le`, `and`, `or`, `not`, `mod`, `div`

### ✨ 35+ Snippets (шаблоны кода)

**Базовые конструкции:**
- `method` → Определение метода
- `object` → Определение объекта  
- `if` / `ifthen` → Условные операторы
- `try` → Обработка ошибок (handle/elsehandle)
- `case` → Case-подобная конструкция

**Циклы:**
- `dovalues` → Цикл по значениям коллекции
- `doindex` → Цикл с индексом
- `dofromto` → Числовой цикл from-to
- `doindexprogress` → Цикл с прогресс-баром
- `skip` / `break` / `return` → Управление потоком

**UI элементы:**
- `form` → Создание формы (dialog/docking)
- `frame` → Создание фрейма
- `button` → Кнопка с callback
- `textfield` → Текстовое поле
- `toggle` → Переключатель
- `optionlist` → Список опций
- `handleform` → Обработка событий формы

**Типы данных:**
- `str`, `real`, `bool`, `array` → Переменные с типом
- `var` / `gvar` → Локальные/глобальные переменные
- `member` → Член объекта

**Работа с данными:**
- `collectallfor` → Сбор элементов из БД AVEVA
- `evaluate` → Вычисление выражений для списков
- `query` → Запрос атрибутов элементов
- `fileread` / `filewrite` → Работа с файлами
- `name` → Получение имени элемента

**Прочее:**
- `out` → Вывод в консоль PML
- `alert` → Диалоговое окно
- `progress` → Установка прогресс-бара
- `callback` → Callback-метод
- `constructor` → Конструктор объекта
- `using` → Импорт namespace
- `header` → Заголовок секции с комментарием
- `elseif` → Ветка else-if

### 🔧 Автоформатирование

**Использование:** `Shift+Alt+F` или правый клик → Format Document

**Правила форматирования:**
- ✅ **Исправление отступов** - автоматически конвертирует табуляции → пробелы и исправляет вложенность
- ✅ **Выравнивание присваиваний** - выравнивает `=` в группах присваиваний для лучшей читаемости
- ✅ Удаление множественных пустых строк (макс. 1 пустая)
- ✅ Форматирование блоков `define method ... endmethod`
- ✅ Форматирование блоков `setup form ... exit` и `frame ... exit`
- ✅ Сохранение комментариев без изменений
- ✅ Автоматическая расстановка пустых строк

**Настройки форматтера** (`Ctrl+,` → PML):
- `pml.formatter.fixIndentation` - Исправление отступов (по умолчанию: включено)
- `pml.formatter.alignAssignments` - Выравнивание присваиваний (по умолчанию: включено)
- `pml.formatter.removeMultipleEmptyLines` - Удаление двойных пустых строк (по умолчанию: включено)
- `pml.formatter.formatMethodBlocks` - Форматирование method блоков (по умолчанию: включено)
- `pml.formatter.formatFormBlocks` - Форматирование form блоков (по умолчанию: включено)

### 🔍 Диагностика ошибок (в реальном времени)

**Автоматически проверяет код на:**
- ❌ Незакрытые блоки `method`/`endmethod`
- ❌ Незакрытые блоки `object`/`endobject`
- ❌ Незакрытые блоки `if`/`endif`
- ❌ Незакрытые блоки `do`/`enddo`
- ❌ Незакрытые блоки `form`/`frame`/`exit`
- ❌ Незакрытые блоки `handle`/`endhandle`
- ⚠️ Отсутствие скобок `()` в определениях методов
- ℹ️ Использование глобальных переменных (рекомендации)

**Работает автоматически** при вводе, сохранении и открытии файлов!

### 💡 IntelliSense (автодополнение)

**Активация:** Автоматически при вводе `.` `!` `|` или `Ctrl+Space`

**Автодополнение для:**
- 🔤 Ключевые слова PML с готовыми шаблонами
- 🔧 Встроенные функции с параметрами
- 📦 Типы данных (STRING, REAL, BOOLEAN, etc.)
- 🌐 Глобальные системные переменные (`!!ce`, `!!FMSYS`, `!!error`)
- 🏗️ Атрибуты AVEVA E3D:
  - Базовые: `NAME`, `TYPE`, `OWNER`, `POSITION`, `ORIENTATION`, `DIRECTION`
  - Геометрия: `XLEN`, `YLEN`, `ZLEN`, `BORE`, `HBORE`, `HEIGHT`, `DIAMETER`
  - Трубопроводы: `PSPEC`, `PTUBE`, `CATE`, `PURPOSE`, `FLUIDCODE`
  - Прочие: `TEMPERATURE`, `PRESSURE`, `MATERIAL`, `RATING`, `SCHEDULE`

### 📖 Hover подсказки

**Использование:** Просто наведи мышь на любое ключевое слово

**Показывает:**
- 📝 Синтаксис использования
- 📖 Описание функционала
- 💻 Примеры кода
- ⚙️ Параметры функций

**Документация доступна для:**
- Ключевых слов (`method`, `if`, `do`, `handle`, `object`)
- Встроенных функций (`query`, `output`, `collectallfor`, `Evaluate`, `FILE`)
- Типов данных с методами (`STRING`, `REAL`, `ARRAY` и др.)
- Операторов (`eq`, `ne`, `gt`, `and`, `or`, `not`)
- Глобальных переменных (`!!ce`, `!!FMSYS`)
- Констант (`TRUE`, `FALSE`, `PI`)

### 🛠️ PML Tools Menu

**Использование:** `Ctrl+Shift+P` → "PML Tools"

**Сортировки:**
- `Сортировать строки A→Z` - алфавитная сортировка
- `Сортировать строки Z→A` - обратная алфавитная сортировка
- `Сортировать по длине строк` - от коротких к длинным
- `Умная сортировка (как Python)` - числа, версии, строки

**Дубликаты:**
- `Удалить дубликаты строк` - удаляет все дубликаты
- `Удалить последовательные дубликаты` - удаляет только подряд идущие

**Пробелы:**
- `Удалить пустые строки` - удаляет все пустые строки
- `Удалить строки только с пробелами` - удаляет строки с whitespace
- `Trim пробелы в начале/конце` - удаляет trailing spaces
- `Табуляции → Пробелы` - конвертирует табуляции в пробелы (4 пробела = 1 таб)
- `Пробелы → Табуляции` - обратная конвертация

**PML специфичные:**
- `Извлечь все переменные` - список всех !var и !!var
- `Извлечь все методы` - список всех define method
- `Удалить все комментарии` - удаляет -- и $* комментарии

### 🎯 Дополнительные возможности

- **Code Folding** - сворачивание блоков method, form, if, do
- **Auto-closing Pairs** - автозакрытие `()`, `[]`, `{}`, `||`, кавычек
- **Bracket Matching** - подсветка парных скобок
- **Indentation Rules** - автоматические отступы
- **Document Outline** (Ctrl+Shift+O) - навигация по методам, объектам, формам
- **Word-based Completion** - автодополнение слов из документа (работает даже в строках)

## Установка

### Из VS Code Marketplace:
1. Открой VS Code
2. Extensions (Ctrl+Shift+X)
3. Найди "PML for AVEVA E3D"
4. Нажми Install

### Из VSIX (локально):
```bash
vsce package
code --install-extension pml-aveva-e3d-0.1.0.vsix
```

### Из исходников (разработка):
```bash
git clone <repo-url>
cd vscode-pml-extension
npm install
npm run compile
# Нажми F5 в VS Code
```

## Использование

### Быстрый старт

1. Открой файл `.pml`, `.pmlobj` или `.pmlfnc`
2. Расширение активируется автоматически
3. Начни печатать — работает автодополнение (Ctrl+Space)
4. Используй snippets: набери префикс и нажми Tab
5. Форматируй код: Shift+Alt+F
6. Проверяй ошибки в панели Problems (Ctrl+Shift+M)

### Примеры snippets

```pml
method<Tab>  → Создает шаблон метода
if<Tab>      → Создает if-then-else
dovalues<Tab> → Создает цикл по значениям
try<Tab>     → Создает обработку ошибок
form<Tab>    → Создает форму
out<Tab>     → Вывод сообщения
```

### Примеры кода

**Метод с циклом:**
```pml
define method .calculateTotal()
    !sum = 0
    
    do !item values !items
        !sum = !sum + !item.value
    enddo
    
    return !sum
endmethod
```

**Форма с вложенным фреймом:**
```pml
setup form !!MyForm dialog docking right
    frame .mainFrame width 50
        button .btnOK text |OK| callback .onOK()
        button .btnCancel text |Cancel| callback .onCancel()
    exit
exit
```

**Сбор элементов из БД:**
```pml
!types = |PIPE|
!filt = |NAME eq 'TEST'|
!place = !!ce
!elements = !!collectallfor(!types, !filt, !place)
```

**Обработка ошибок:**
```pml
!error = object ERROR()
handle any
    !file.open('read')
    !data = !file.readline()
    !file.close()
elsehandle
    !error = !!error
    |Error: | & !error.message().output()
endhandle
```

## Настройки

Открой Settings (Ctrl+,) и найди "PML":

```json
{
  "pml.formatter.indentSize": 4,
  "pml.formatter.removeMultipleEmptyLines": true,
  "pml.formatter.formatMethodBlocks": true,
  "pml.formatter.formatFormBlocks": true
}
```

### Параметры:
- `pml.formatter.indentSize` - Количество пробелов для отступа (по умолчанию: 4)
- `pml.formatter.removeMultipleEmptyLines` - Удалять множественные пустые строки (по умолчанию: true)
- `pml.formatter.formatMethodBlocks` - Форматировать блоки method (по умолчанию: true)
- `pml.formatter.formatFormBlocks` - Форматировать блоки form/frame (по умолчанию: true)

## Поддерживаемые расширения файлов

- `.pml` - Стандартные PML скрипты
- `.pmlobj` - Объекты PML
- `.pmlfnc` - Функции PML

## Что дальше?

Планируемые функции:
- [ ] Symbol Provider (навигация по методам в файле)
- [ ] Definition Provider (переход к определению F12)
- [ ] Reference Provider (поиск использований)
- [ ] Rename Provider (переименование символов F2)
- [ ] Code Actions (быстрые исправления)
- [ ] Signature Help (подсказки параметров при вызове)
- [ ] Bracket Pair Colorization (цветные скобки)
- [ ] Semantic Highlighting (семантическая подсветка)

## Разработка

### Сборка проекта

```bash
# Установка зависимостей
npm install

# Компиляция TypeScript → JavaScript
npm run compile

# Режим watch (автоматическая компиляция)
npm run watch

# Локальное тестирование
# Открой папку в VS Code и нажми F5

# Упаковка расширения
vsce package
```

### Структура проекта

```
vscode-pml-extension/
├── src/
│   ├── extension.ts      # Главный файл расширения
│   ├── formatter.ts      # Форматирование кода
│   ├── diagnostics.ts    # Проверка ошибок
│   ├── completion.ts     # Автодополнение
│   └── hover.ts          # Подсказки при наведении
├── syntaxes/
│   └── pml.tmLanguage.json  # Грамматика подсветки
├── snippets/
│   └── pml.json             # Шаблоны кода
└── out/                      # Скомпилированный JS
```

## Вклад в проект

Нашел баг или есть идея? Открой Issue на GitHub!

Pull requests приветствуются.

## История изменений

### 0.1.0 (Текущая версия)
- ✅ Подсветка синтаксиса (60+ ключевых слов)
- ✅ 35+ snippets (шаблонов кода)
- ✅ Автоформатирование (3 правила)
- ✅ Диагностика ошибок (5 типов проверок)
- ✅ IntelliSense автодополнение
- ✅ Hover подсказки с документацией
- ✅ Code folding, auto-closing pairs
- ✅ Настраиваемые параметры форматирования

См. [CHANGELOG.md](CHANGELOG.md) для полной истории.

## Лицензия

MIT License - See LICENSE file for details

## Автор

Создано для разработчиков PML в AVEVA E3D/PDMS.

---

**Enjoy coding in PML!** 🚀

*Если расширение помогло тебе — поставь ⭐ на GitHub!*
