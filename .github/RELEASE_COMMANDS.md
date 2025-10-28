# Release Commands Quick Reference

Быстрая шпаргалка команд для релиза.

## 🚀 Полный цикл релиза (Copy-Paste)

```bash
# 1. Компиляция и сборка VSIX
npm run compile
npx @vscode/vsce package --no-yarn

# 2. Локальная установка и тестирование
code --install-extension pml-aveva-e3d-0.7.X.vsix --force
cursor --install-extension pml-aveva-e3d-0.7.X.vsix --force

# 3. После тестирования - удаление старых VSIX
git rm pml-aveva-e3d-0.7.*.vsix  # except latest version

# 4. Коммит и пуш
git add -A
git commit -m "release: v0.7.X - description"
git push

# 5. Создание GitHub release
"C:\Program Files\GitHub CLI\gh.exe" release create v0.7.X pml-aveva-e3d-0.7.X.vsix --title "v0.7.X - Title" --notes-file RELEASE_NOTES_v0.7.X.md
```

---

## 📦 Отдельные команды

### Компиляция
```bash
npm run compile
```

### Сборка VSIX
```bash
npx @vscode/vsce package --no-yarn
```

### Установка в VS Code
```bash
code --install-extension pml-aveva-e3d-0.7.X.vsix --force
```

### Установка в Cursor
```bash
cursor --install-extension pml-aveva-e3d-0.7.X.vsix --force
```

---

## 🗑️ Очистка старых VSIX

### Удалить все кроме последней версии
```bash
# Список всех VSIX в git
git ls-files "*.vsix"

# Удалить конкретные версии
git rm pml-aveva-e3d-0.7.1.vsix
git rm pml-aveva-e3d-0.7.2.vsix

# Удалить все старые (bash wildcard)
git rm pml-aveva-e3d-0.7.[0-2].vsix
```

### Удалить локальные VSIX файлы (PowerShell)
```powershell
# Список всех VSIX в папке
Get-ChildItem pml-aveva-e3d-*.vsix

# Удалить все кроме последней
Get-ChildItem pml-aveva-e3d-*.vsix | Where-Object { $_.Name -ne "pml-aveva-e3d-0.7.3.vsix" } | Remove-Item
```

---

## 📝 Git команды

### Статус и diff
```bash
git status
git diff
git log --oneline -5
```

### Коммит всех изменений
```bash
git add -A
git commit -m "message"
git push
```

### Отмена последнего коммита (если не запушен)
```bash
git reset --soft HEAD~1  # Отменить коммит, сохранить изменения
git reset --hard HEAD~1  # Отменить коммит и изменения (ОПАСНО!)
```

### Изменить последний коммит
```bash
git commit --amend -m "new message"
git push --force  # Если уже запушен (ОПАСНО на main!)
```

---

## 🎯 GitHub CLI (gh) команды

### Проверка авторизации
```bash
"C:\Program Files\GitHub CLI\gh.exe" auth status
```

### Логин
```bash
"C:\Program Files\GitHub CLI\gh.exe" auth login
```

### Создание релиза
```bash
# Основная команда
"C:\Program Files\GitHub CLI\gh.exe" release create v0.7.X pml-aveva-e3d-0.7.X.vsix --title "v0.7.X - Title" --notes "Description"

# С файлом release notes
"C:\Program Files\GitHub CLI\gh.exe" release create v0.7.X pml-aveva-e3d-0.7.X.vsix --title "v0.7.X - Title" --notes-file RELEASE_NOTES_v0.7.X.md

# С несколькими файлами
"C:\Program Files\GitHub CLI\gh.exe" release create v0.7.X file1.vsix file2.zip --title "Title" --notes "Notes"
```

### Список релизов
```bash
"C:\Program Files\GitHub CLI\gh.exe" release list
```

### Просмотр релиза
```bash
"C:\Program Files\GitHub CLI\gh.exe" release view v0.7.X
```

### Удаление релиза
```bash
"C:\Program Files\GitHub CLI\gh.exe" release delete v0.7.X
```

### Загрузка файла в существующий релиз
```bash
"C:\Program Files\GitHub CLI\gh.exe" release upload v0.7.X pml-aveva-e3d-0.7.X.vsix
```

---

## 🔍 Полезные проверки

### Размер VSIX файла
```bash
# PowerShell
(Get-Item pml-aveva-e3d-0.7.X.vsix).Length / 1MB
```

### Содержимое VSIX (список файлов)
```bash
npx @vscode/vsce ls --tree
```

### Версия в package.json
```bash
# PowerShell
(Get-Content package.json | ConvertFrom-Json).version

# Bash
grep '"version"' package.json
```

### Последний коммит
```bash
git log -1 --oneline
```

### Последний тег
```bash
git describe --tags --abbrev=0
```

---

## 🧪 Тестирование

### Запуск компиляции и проверка ошибок
```bash
npm run compile 2>&1 | Select-String "error"
```

### Проверка TypeScript ошибок
```bash
npx tsc --noEmit
```

### Список установленных расширений
```bash
code --list-extensions | Select-String "pml"
```

---

## 📊 Статистика

### Количество файлов в проекте
```bash
# PowerShell
(Get-ChildItem -Recurse -File | Measure-Object).Count
```

### Количество строк кода
```bash
# PowerShell - TypeScript files only
(Get-ChildItem -Recurse -Filter *.ts | Get-Content | Measure-Object -Line).Lines
```

### Размер папки
```bash
# PowerShell
"{0:N2} MB" -f ((Get-ChildItem -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB)
```

---

## 🔧 Troubleshooting

### Очистка node_modules и переустановка
```bash
rm -rf node_modules
rm package-lock.json
npm install
```

### Пересборка с нуля
```bash
npm run clean  # Если есть clean script
npm run compile
npx @vscode/vsce package --no-yarn
```

### Проверка GitHub CLI пути
```bash
# PowerShell
Get-Command gh -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source

# Или прямой вызов
& "C:\Program Files\GitHub CLI\gh.exe" --version
```

---

**Created**: 2025-01-24
**For**: PML for AVEVA E3D Extension
