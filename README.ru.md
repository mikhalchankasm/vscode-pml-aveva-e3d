PML для AVEVA E3D — расширение VS Code

Подсветка синтаксиса и инструменты для языка PML (Programmable Macro Language) AVEVA E3D в Visual Studio Code.

Возможности
- Подсветка синтаксиса (TextMate)
- Конфигурация языка (комментарии, скобки, правила отступов при Enter)
- Форматирование (отступы, пустые строки, блоки method/form/frame, выравнивание присваиваний)
- IntelliSense: автодополнение (ключевые слова, типы, атрибуты, методы), подсказки параметров
- Hover‑документация (JSDoc‑комментарии над методами)
- Outline (обзор документа): методы, объекты, формы, фреймы
- Диагностика: незакрытые блоки, базовые проверки
- Инструменты (Command Palette): сортировка строк, обрезка пробелов, удаление дублей, извлечение переменных/методов
- Переход к определению / Поиск ссылок / Переименование (методы)

Установка
1) Из VSIX (локальная сборка):
   - `npm install`
   - `npm run compile`
   - Сборка: `npx vsce package`
   - Установка: `code --install-extension pml-aveva-e3d-*.vsix`

2) Из исходников (отладка):
   - Откройте папку в VS Code и нажмите `F5` для Extension Development Host

Типы файлов
- `.pml`, `.pmlobj`, `.pmlfnc`, `.pmlfrm`, `.pmlmac`, `.pmlcmd`

Сниппеты
- Управляющие конструкции (if/then/else, циклы)
- Заготовки для UI (form/frame)
- Объявления переменных и помощники

Настройки форматтера (`settings.json`)
- `pml.formatter.indentSize` (число, по умолчанию 4)
- `pml.formatter.removeMultipleEmptyLines` (boolean)
- `pml.formatter.formatMethodBlocks` (boolean)
- `pml.formatter.formatFormBlocks` (boolean)
- `pml.formatter.alignAssignments` (boolean)
- `pml.formatter.fixIndentation` (boolean)

JSDoc‑документация
- Размещайте строки `--` над `define method .name()`
- Теги: `@param`, `@return`, `@example`, `@deprecated`, `@author`, `@since`, `@see`, `@form`, `@callback`

Команды (Command Palette)
- PML: Format PML Document
- PML Tools: Sort Lines A‑Z / Z‑A / by Length / Smart Natural Sort
- PML Tools: Remove Duplicates / Consecutive Duplicates / Empty Lines / Whitespace‑only Lines / Trim Trailing Whitespace / Tabs ↔ Spaces
- PML Tools: Extract Variables / Extract Methods / Remove Comments
- Показать методы STRING/REAL/ARRAY/DBREF, Показать все методы

Разработка
- Линт: `npm run lint`
- Сборка: `npm run compile`
- CI: GitHub Actions (lint + build при push/PR)
- Релиз: пушьте тег `v*` (например, `v0.4.0`) — создастся GitHub Release с VSIX

Документация
- Полный индекс — в `docs/README.md`.

