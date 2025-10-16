# Локальная разработка и установка VSIX (Windows)

## Быстрый цикл
- Собрать и установить последнюю сборку:
  ```powershell
  npm run pack:install
  ```
- Переустановить последнюю сборку без сборки:
  ```powershell
  npm run install:local
  ```
- Собрать и установить конкретную версию:
  ```powershell
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\reinstall.ps1 -Pack -Version 0.4.2
  ```

## Что делает `scripts/reinstall.ps1`
- Ищет последний `pml-aveva-e3d-*.vsix` (или `pml-aveva-e3d-<Version>.vsix` при `-Version`).
- Удаляет ранее установленные расширения `mikhalchankasm.pml-aveva-e3d` и `your-publisher-name.pml-aveva-e3d` из VS Code и Cursor (если установлен CLI), затем устанавливает выбранный `.vsix` с `--force`.
- При `-Pack` удаляет старые `.vsix` и вызывает упаковку (`npx @vscode/vsce package --no-yarn`).

## Прямые команды (без npm‑скриптов)
```powershell
# VS Code
code --uninstall-extension mikhalchankasm.pml-aveva-e3d 2>$null
code --uninstall-extension your-publisher-name.pml-aveva-e3d 2>$null
code --install-extension pml-aveva-e3d-0.4.2.vsix --force

# Cursor (если установлен CLI)
cursor --uninstall-extension mikhalchankasm.pml-aveva-e3d 2>$null
cursor --uninstall-extension your-publisher-name.pml-aveva-e3d 2>$null
cursor --install-extension pml-aveva-e3d-0.4.2.vsix --force
```

## Версии и релизы
- Версия хранится в `package.json: version` и используется для имени `.vsix`.
- Бамп версии:
  ```powershell
  npm run bump:patch   # 0.4.1 -> 0.4.2
  npm run bump:minor   # 0.4.x -> 0.5.0
  npm run bump:major   # x.y.z -> (x+1).0.0
  ```
- Релиз на GitHub (без Marketplace):
  1. Обновить `docs/CHANGELOG.md`.
  2. `git add -A && git commit -m "chore(release): vX.Y.Z" && git push`
  3. Либо:
     - `git tag vX.Y.Z && git push origin vX.Y.Z`
     - Либо Actions → `Release VSIX` → `Run workflow` (tag можно оставить пустым — возьмёт из package.json).
- Релиз автоматически создаст `.vsix` и прикрепит к GitHub Release.

## Полезно знать
- Если `code` не в PATH: запустите терминал из VS Code (Terminal → New Terminal) или установите команду в PATH (Command Palette: "Shell Command: Install 'code' command in PATH" — на Windows обычно уже доступна).
- `cursor` используется только если установлен Cursor CLI и присутствует в PATH: шаги для Cursor пропускаются автоматически, если команды нет.
- Пакет `scripts/**` исключён из `.vscodeignore` и не попадёт в публикуемый `.vsix`.
