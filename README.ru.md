# PML для AVEVA E3D — расширение VS Code

Подсветка синтаксиса и инструменты для языка PML (Programmable Macro Language) AVEVA E3D в Visual Studio Code.

## Возможности

- Подсветка синтаксиса (TextMate)
- Конфигурация языка (комментарии, скобки, правила отступов при Enter)
- Форматирование (отступы, пустые строки, блоки method/form/frame, выравнивание присваиваний)
- IntelliSense: автодополнение (ключевые слова, типы, атрибуты, методы), подсказки параметров (Signature Help)
- Hover‑документация (JSDoc‑комментарии над методами)
- Outline (обзор документа): методы, объекты, формы, фреймы
- Диагностика: незакрытые блоки, базовые проверки
- Инструменты (Command Palette): сортировка строк, обрезка пробелов, удаление дублей, извлечение переменных/методов
- Переход к определению / Поиск ссылок / Переименование (методы)

## Установка

1) Из VSIX (локальная сборка):
   - `npm install`
   - `npm run compile`
   - Сборка: `npx vsce package`
   - Установка: `code --install-extension pml-aveva-e3d-*.vsix`

2) Из исходников (отладка):
   - Откройте папку в VS Code и нажмите `F5` для Extension Development Host

## Типы файлов

- `.pml`, `.pmlobj`, `.pmlfnc`, `.pmlfrm`, `.pmlmac`, `.pmlcmd`

## Сниппеты

- Управляющие конструкции (if/then/else, циклы)
- Заготовки для UI (form/frame)
- Объявления переменных и помощники

## Настройки форматтера (`settings.json`)

- `pml.formatter.indentSize` (число, по умолчанию 4)
- `pml.formatter.removeMultipleEmptyLines` (boolean)
- `pml.formatter.formatMethodBlocks` (boolean)
- `pml.formatter.formatFormBlocks` (boolean)
- `pml.formatter.alignAssignments` (boolean)
- `pml.formatter.fixIndentation` (boolean)

## JSDoc‑документация

- Размещайте строки `--` над `define method .name()`
- Теги: `@param`, `@return`, `@example`, `@deprecated`, `@author`, `@since`, `@see`, `@form`, `@callback`

## Команды (Command Palette)

- PML: Format PML Document
- PML Tools: Sort Lines A‑Z / Z‑A / by Length / Smart Natural Sort
- PML Tools: Remove Duplicates / Consecutive Duplicates / Empty Lines / Whitespace‑only Lines / Trim Trailing Whitespace / Tabs ↔ Spaces
- PML Tools: Extract Variables / Extract Methods / Remove Comments
- Показать методы STRING/REAL/ARRAY/DBREF, Показать все методы

## Быстрая локальная установка (Windows)

- Вариант 1 (собрать и установить последнюю сборку):
  ```powershell
  npm run pack:install
  ```
- Вариант 2 (переустановить последнюю сборку без сборки):
  ```powershell
  npm run install:local
  ```
- Вариант 3 (конкретная версия):
  ```powershell
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\reinstall.ps1 -Pack -Version 0.4.1
  ```

Скрипт `scripts/reinstall.ps1`:
- Ищет последний `pml-aveva-e3d-*.vsix` (или `pml-aveva-e3d-<Version>.vsix` при `-Version`).
- Удаляет ранее установленные расширения `mikhalchankasm.pml-aveva-e3d` и `your-publisher-name.pml-aveva-e3d` из VS Code и Cursor (если установлен CLI), затем устанавливает выбранный `.vsix` с `--force`.
- Параметр `-Pack` перед установкой вызывает сборку VSIX (`npx @vscode/vsce package --no-yarn`).

Прямые команды (без npm‑скриптов):
```powershell
# VS Code
code --uninstall-extension mikhalchankasm.pml-aveva-e3d 2>$null
code --uninstall-extension your-publisher-name.pml-aveva-e3d 2>$null
code --install-extension pml-aveva-e3d-0.4.1.vsix --force

# Если установлен Cursor CLI, можно продублировать команды с cursor:
cursor --uninstall-extension mikhalchankasm.pml-aveva-e3d 2>$null
cursor --uninstall-extension your-publisher-name.pml-aveva-e3d 2>$null
cursor --install-extension pml-aveva-e3d-0.4.1.vsix --force
```

Примечания:
- Если команда `code` недоступна в PowerShell, откройте терминал из VS Code (Terminal → New Terminal) или добавьте VS Code в PATH, затем перезапустите оболочку.
- `cursor` используется только если установлен Cursor CLI и присутствует в PATH — иначе скрипт пропустит шаги для Cursor автоматически.


- Линт: `npm run lint`
- Сборка: `npm run compile`
- CI: GitHub Actions (lint + build при push/PR)
- Релиз: пушьте тег `v*` (например, `v0.4.1`) — создастся GitHub Release с VSIX

## Документация

- Полный индекс — в `docs/README.md`.

## Требования

- Visual Studio Code 1.80.0+

## Известные проблемы

- Языковые функции частично эвристические; сообщайте о ложных срабатываниях в Issues.

## История версий

- См. `docs/CHANGELOG.md` и GitHub Releases.

## Лицензия

- MIT (см. LICENSE).

