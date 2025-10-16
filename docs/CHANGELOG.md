# Change Log

## [0.4.4] - 2025-10-16

### Fixed
- **Formatter: Fixed incorrect indentation for elseif/else blocks**
  - Multiple elseif/else now properly aligned with their parent if
  - Nested if/elseif/else blocks maintain correct indentation levels
  - Content inside elseif/else blocks receives proper increased indentation
  - Fixed bug where currentIndent was incorrectly decreased for elseif/else

## [0.4.3] - 2025-10-16

### Added
- scripts/LOCAL_DEV.md — быстрый Windows цикл: сборка/установка VSIX, релизы, бамп версий.

### Changed
- npm run pack удаляет старые .vsix перед упаковкой.
- reinstall.ps1 при -Pack также чистит старые .vsix перед сборкой.

## [0.4.1] - 2025-10-16

### Added
- Definition, References, Rename providers for methods (.methodName()).
- Signature Help for methods based on pmlTypes.
- Release workflow: builds VSIX on tag/workflow_dispatch, creates GitHub Release, attaches VSIX, uses docs/CHANGELOG.md as body.
- Readme split EN/RU; badges (CI/Release/Downloads/License).

### Changed
- UI strings cleaned up; neutral icon added and wired.
- TextMate grammar/operator fixes; language configuration on-enter rules.
- Formatter reads indent size from settings, tools rewritten and stabilized.
- Documentation/hover content normalized to English headings.

### Infrastructure
- CI lint+build; ESLint rules tuned to avoid CI failures (no-explicit-any, no-console).
Все изменения расширения "PML for AVEVA E3D" документируются в этом файле.

## [0.2.4] - 2025-10-14

### Исправлено
- **✅ Исправление отступов включено обратно** ⭐
  - Баги исправлены - теперь работает стабильно
  - Автоматически конвертирует табуляции → пробелы
  - Исправляет отступы по уровню вложенности (4 пробела на уровень)
  - Включено по умолчанию: `pml.formatter.fixIndentation` = true

## [0.2.3] - 2025-10-14

### Исправлено
- **🐛 HOTFIX: alignAssignments терял строки** 🔴 КРИТИЧНО
  - Исправлен баг с потерей строк при выравнивании присваиваний
  - Одиночные присваивания теперь не теряются
  - Порядок строк сохраняется

## [0.3.1] - 2025-10-14

### Добавлено
- **⌨️ Горячие клавиши для методов типов** ⭐⭐
  - **Ctrl+Shift+S** → показать STRING методы
  - **Ctrl+Shift+R** → показать REAL методы  
  - **Ctrl+Shift+A** → показать ARRAY методы
  - **Ctrl+Shift+D** → показать DBREF методы
  - **Ctrl+Shift+M** → показать ВСЕ методы типов
  - QuickPick с поиском и вставкой методов
  - Автоматическая вставка с параметрами-плейсхолдерами

- **🧠 Улучшенное автоопределение типов** ⭐
  - **Циклы:** `do !element values !collection` → `!element.` = DBREF методы
  - **Контекстные методы:** `.query()` → STRING, `.size()` → REAL
  - **Умный поиск:** работает даже без пустых строк
  - **Type hints:** поддержка `-- @type STRING` (опционально)

- **📋 Command Palette команды**
  - "PML: Show STRING Methods"
  - "PML: Show REAL Methods"  
  - "PML: Show ARRAY Methods"
  - "PML: Show DBREF Methods"
  - "PML: Show All Type Methods"

- **📁 Новые файлы**
  - `src/methodCommands.ts` - команды для методов типов
  - `test_methods.pml` - демонстрация всех возможностей

## [0.3.0] - 2025-10-14

### Добавлено
- **📖 Документирование методов (JSDoc-style)** ⭐
  - Система комментариев перед методами с тегами @param, @return, @example и др.
  - Hover на вызове метода показывает документацию из комментариев
  - Outline (Ctrl+Shift+O) показывает краткое описание метода
  - Поддержка тегов: @param, @return, @example, @deprecated, @author, @since, @see, @form, @callback
  - Файл `DOCUMENTATION_SYNTAX.md` с примерами и best practices

- **🏷️ Type Hints и методы базовых типов** ⭐⭐
  - **47 STRING методов** из официальной документации AVEVA
  - **6 REAL методов** (Abs, Round, Floor, Ceiling, String)
  - **9 ARRAY методов** (Append, Size, Remove, First, Last, Evaluate)
  - **2 DBREF метода** (Query, String)
  - **Type hints в комментариях:** `-- @type STRING` или inline `-- STRING`
  - **Автоопределение типа:** по присваиванию (STRING(), |text|, 42, TRUE, etc.)
  - **Smart completion после точки:** показывает методы для конкретного типа
  - Если тип неизвестен - показывает все методы с метками `[STRING]`, `[REAL]`, etc.
  - Файл `TYPE_HINTS.md` с примерами
  - Файл `test_type_hints.pml` с демонстрацией

### Пример использования:
```pml
-- Вычисляет сумму элементов массива
-- @param !list - массив чисел
-- @return сумма всех элементов
-- @example !total = .calculateSum(!myList)
define method .calculateSum(!list)
    !sum = 0
    do !item values !list
        !sum = !sum + !item
    enddo
    return !sum
endmethod

-- При наведении на .calculateSum() покажет всю документацию!
```

## [0.2.2] - 2025-10-14

### Исправлено
- **🐛 HOTFIX: Форматтер удалял строки** 🔴 КРИТИЧНО
  - Отключена автоматическая коррекция отступов (была включена по умолчанию)
  - Теперь это опциональная настройка `pml.formatter.fixIndentation` (по умолчанию: false)
  - ⚠️ Временно до исправления бага в alignAssignments

## [0.2.1] - 2025-10-14

### Добавлено
- **🔧 Автоматическая коррекция отступов** (ЭКСПЕРИМЕНТАЛЬНО)
  - Форматтер может автоматически исправлять отступы внутри блоков
  - Работает с методами, объектами, формами, циклами, условиями
  - Применяет минимум 4 пробела (1 tab) на уровень вложенности
  - Правильно обрабатывает else/elseif/elsehandle
  - ⚠️ ВРЕМЕННО ОТКЛЮЧЕНО в v0.2.2 из-за бага

## [0.2.0] - 2025-10-12

### Добавлено
- **📐 Выравнивание присваиваний (Align Assignments)** ⭐
  - Автоматически выравнивает знаки `=` в группах присваиваний
  - "Причесывает" код для лучшей читаемости
  - Работает с группами из 2+ строк подряд
  - Исключает операторы сравнения (==, !=, >=, <=)
  - Настраиваемо: `pml.formatter.alignAssignments` (по умолчанию: true)
  
- **Поддержка дополнительных расширений файлов** 📄
  - `.pmlfrm` (forms) — теперь работает!
  - `.pmlmac` (macros)
  - `.pmlcmd` (commands)
  - Всего поддерживается: `.pml`, `.pmlobj`, `.pmlfnc`, `.pmlfrm`, `.pmlmac`, `.pmlcmd`

- **🛠️ PML Tools Menu** ⭐
  - **Сортировки**: A→Z, Z→A, по длине, умная сортировка (как Python)
  - **Дубликаты**: Удаление дубликатов строк и последовательных дубликатов
  - **Пробелы**: Удаление пустых строк, trim пробелов, конвертация табуляций ↔ пробелы
  - **PML специфичные**: Извлечение переменных, методов, удаление комментариев
  - Доступно через Ctrl+Shift+P → "PML Tools"
  - Кнопка "Format PML Document" в title bar для PML файлов

### Пример выравнивания:
**Было:**
```pml
!this.ndtinspectiontype = !this.bran.:ExamMethod.string()
!this.weldinspectionpercent = !this.weldControl()
!this.mkccompatibility =  !this.mkccomp()
```

**Стало (после Shift+Alt+F):**
```pml
!this.ndtinspectiontype     = !this.bran.:ExamMethod.string()
!this.weldinspectionpercent = !this.weldControl()
!this.mkccompatibility      = !this.mkccomp()
```

## [0.1.4] - 2025-10-12

### Исправлено
- **Word-based автодополнение теперь работает со словами в строках** 🔧
  - Извлекает слова из строк: `'DRAWLIST'`, `|NAME|`, `"TYPE"` и т.д.
  - Убирает комментарии перед обработкой (-- и $*)
  - Теперь предлагает ВСЕ слова из документа, включая те что в кавычках
  - Полезно для атрибутов AVEVA в строках

## [0.1.3] - 2025-10-12

### Добавлено
- **📝 Word-based автодополнение (как в Notepad++)** ⭐
  - Автоматически предлагает слова из текущего документа
  - Минимальная длина: 3 символа
  - Умное определение типа: переменные (!var, !!var), методы (.method), константы (UPPERCASE)
  - Пропускает ключевые слова PML (они уже есть в основных предложениях)
  - Показывается в автодополнении (Ctrl+Space)
  - Метка "Из документа" для удобства
  - Отлично для больших файлов с повторяющимися именами

## [0.1.2] - 2025-10-12

### Исправлено
- **Убраны ложные предупреждения о глобальных переменных** 🔧
  - Глобальные переменные (`!!var`) — это нормальная практика в PML
  - Убрана информационная диагностика "Рекомендуется использовать локальные переменные"
  - В PML без глобальных переменных не обойтись

## [0.1.1] - 2025-10-12

### Добавлено
- **📍 Навигация по символам (Symbol Provider)** 🎯
  - Outline view (Ctrl+Shift+O) показывает все методы, объекты, формы
  - Быстрый переход к любому методу в файле
  - Поиск методов по имени
  - Поддержка: `define method`, `define object`, `setup form`, `frame`
  - Иконки для разных типов символов

## [0.1.0] - 2025-10-12

### Добавлено

#### 🎨 Подсветка синтаксиса
- Поддержка 60+ ключевых слов PML
- Комментарии: `--` и `$*` стили
- Строки: `|pipe|`, `'single'`, `"double"`
- Переменные: `!local` и `!!global`
- Методы: `.methodName()` с подсветкой вызовов
- Типы данных: STRING, REAL, BOOLEAN, ARRAY, DBREF, INTEGER, ANY
- Встроенные функции: query, output, collectallfor, Evaluate, FILE, ERROR и др.
- Операторы: eq, ne, gt, lt, ge, le, and, or, not, mod, div
- Константы: TRUE, FALSE, UNSET, PI, E, NULL
- Специальные глобальные переменные: !!ce, !!FMSYS, !!error

#### ✨ Snippets (35+ шаблонов)
**Базовые:**
- `method` - Определение метода
- `object` - Определение объекта
- `if` / `ifthen` - Условные операторы
- `try` - Обработка ошибок (handle/elsehandle)
- `case` - Case-подобная конструкция
- `elseif` - Ветка else-if

**Циклы:**
- `dovalues` - Цикл по значениям
- `doindex` - Цикл с индексом
- `dofromto` - Числовой цикл
- `doindexprogress` - Цикл с прогресс-баром
- `skip` / `break` / `return` - Управление потоком

**UI элементы:**
- `form` - Форма (dialog/docking)
- `frame` - Фрейм
- `button` - Кнопка с callback
- `textfield` - Текстовое поле
- `toggle` - Переключатель
- `optionlist` - Список опций
- `handleform` - Обработка событий формы

**Типы данных:**
- `str`, `real`, `bool`, `array` - Типизированные переменные
- `var` / `gvar` - Локальные/глобальные
- `member` - Член объекта

**Работа с данными:**
- `collectallfor` - Сбор элементов из БД
- `evaluate` - Вычисление выражений для списков
- `query` - Запрос атрибутов
- `fileread` / `filewrite` - Файловые операции
- `name` - Получение имени элемента

**Прочее:**
- `out` - Вывод в консоль
- `alert` - Диалоговое окно
- `progress` - Прогресс-бар
- `callback` - Callback-метод
- `constructor` - Конструктор
- `using` - Импорт namespace
- `header` - Заголовок секции

#### 🔧 Автоформатирование
- Удаление множественных пустых строк (макс. 1)
- Форматирование блоков `define method ... endmethod`
- Форматирование блоков `setup form ... exit` и `frame ... exit`
- Сохранение комментариев без изменений
- Автоматическая расстановка пустых строк
- Команда "Format Document" (Shift+Alt+F)
- Настраиваемые параметры форматирования

#### 🔍 Диагностика ошибок (в реальном времени)
- Проверка незакрытых блоков `method`/`endmethod`
- Проверка незакрытых блоков `object`/`endobject`
- Проверка незакрытых блоков `if`/`endif`
- Проверка незакрытых блоков `do`/`enddo`
- Проверка незакрытых блоков `form`/`frame`/`exit`
- Проверка незакрытых блоков `handle`/`endhandle`
- Предупреждение об отсутствии скобок `()` в методах
- Рекомендации по использованию глобальных переменных
- Автоматическая проверка при вводе, сохранении и открытии файлов

#### 💡 IntelliSense (автодополнение)
- Автодополнение ключевых слов с шаблонами
- Автодополнение встроенных функций с параметрами
- Автодополнение типов данных
- Автодополнение глобальных переменных (!!ce, !!FMSYS, etc.)
- Автодополнение атрибутов AVEVA E3D (NAME, TYPE, BORE, PSPEC, etc.)
- Триггеры: `.` `!` `|` или Ctrl+Space

#### 📖 Hover подсказки
- Документация для ключевых слов
- Документация для встроенных функций с примерами
- Документация для типов данных с методами
- Документация для операторов (eq, ne, gt, and, or, etc.)
- Документация для глобальных переменных
- Документация для констант (TRUE, FALSE, PI, etc.)
- Примеры кода для каждой функции

#### 🎯 Дополнительно
- Code folding (сворачивание блоков)
- Auto-closing pairs для `()`, `[]`, `{}`, `||`, кавычек
- Bracket matching (подсветка парных скобок)
- Indentation rules (автоматические отступы)
- Поддержка расширений: `.pml`, `.pmlobj`, `.pmlfnc`
- Конфигурация языка (language-configuration.json)

#### ⚙️ Настройки
- `pml.formatter.indentSize` - Размер отступа (по умолчанию: 4)
- `pml.formatter.removeMultipleEmptyLines` - Удалять пустые строки (по умолчанию: true)
- `pml.formatter.formatMethodBlocks` - Форматировать блоки method (по умолчанию: true)
- `pml.formatter.formatFormBlocks` - Форматировать блоки form/frame (по умолчанию: true)

### Технические детали
- TypeScript 5.1.6
- VS Code Engine 1.80.0+
- 5 модулей: extension, formatter, diagnostics, completion, hover
- Компиляция в CommonJS (ES2020)
- Source maps для отладки

## [Unreleased]

### Планируется в будущих версиях

#### Навигация и поиск
- [ ] Symbol Provider - дерево символов в файле
- [ ] Definition Provider - переход к определению (F12)
- [ ] Reference Provider - поиск всех использований
- [ ] Rename Provider - переименование символов (F2)
- [ ] Peek Definition - просмотр определения inline

#### Улучшения кода
- [ ] Code Actions - быстрые исправления (лампочка)
- [ ] Signature Help - подсказки параметров при вызове функции
- [ ] Document Symbols - навигация по структуре документа
- [ ] Workspace Symbols - поиск символов во всем проекте

#### Визуальные улучшения
- [ ] Bracket Pair Colorization - цветные скобки
- [ ] Semantic Highlighting - семантическая подсветка
- [ ] Icons для файлов .pml в проводнике
- [ ] Иконка расширения

#### Дополнительные функции
- [ ] Snippets для AVEVA E3D атрибутов
- [ ] Code lens для методов (количество ссылок)
- [ ] Task provider для запуска PML скриптов
- [ ] Debug adapter (если возможно)
- [ ] Интеграция с AVEVA E3D (если API доступен)

#### Тестирование и качество
- [ ] Unit tests для всех модулей
- [ ] Integration tests
- [ ] End-to-end тесты
- [ ] CI/CD pipeline
- [ ] Code coverage

#### Документация
- [ ] Wiki на GitHub
- [ ] Видео-туториалы
- [ ] Примеры проектов
- [ ] Best practices guide

---

## Формат

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.0.0/).

Версионирование согласно [Semantic Versioning](https://semver.org/lang/ru/).

## Типы изменений
- **Добавлено** - новая функциональность
- **Изменено** - изменения в существующей функциональности
- **Устарело** - функции, которые скоро будут удалены
- **Удалено** - удаленная функциональность
- **Исправлено** - исправления багов
- **Безопасность** - исправления уязвимостей



