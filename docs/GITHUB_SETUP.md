# 📦 Публикация на GitHub

## Быстрая настройка

### 1. Создать репозиторий на GitHub

```
1. Перейти на https://github.com/new
2. Repository name: vscode-pml-extension (или любое)
3. Description: PML (AVEVA E3D) language support for VS Code
4. Public/Private: Public (рекомендуется)
5. НЕ добавлять README, .gitignore (уже есть локально)
6. Создать репозиторий
```

### 2. Инициализировать git локально

```bash
# В папке проекта
git init
git add .
git commit -m "Initial commit - PML extension v0.1.0"
```

### 3. Подключить GitHub remote

```bash
# Замени username на свой GitHub username
git remote add origin https://github.com/username/vscode-pml-extension.git

# Push
git branch -M main
git push -u origin main
```

### 4. Создать первый Release

```bash
# 1. Собрать .vsix
npm run compile
vsce package

# 2. На GitHub:
# - Releases → Create a new release
# - Tag: v0.1.0
# - Title: v0.1.0 - Initial Release
# - Description: скопировать из CHANGELOG.md
# - Прикрепить файл: pml-aveva-e3d-0.1.0.vsix
# - Publish release
```

---

## Установка из GitHub (для пользователей)

### Вариант 1: Скачать .vsix из Releases

```bash
# 1. Перейти на https://github.com/username/vscode-pml-extension/releases
# 2. Скачать pml-aveva-e3d-0.1.0.vsix
# 3. Установить
code --install-extension pml-aveva-e3d-0.1.0.vsix
```

### Вариант 2: Клонировать и собрать

```bash
git clone https://github.com/username/vscode-pml-extension.git
cd vscode-pml-extension
npm install
npm run compile
vsce package
code --install-extension pml-aveva-e3d-0.1.0.vsix
```

### Вариант 3: Symlink для разработки

```bash
git clone https://github.com/username/vscode-pml-extension.git
cd vscode-pml-extension
npm install
npm run compile

# Windows
mklink /D "%USERPROFILE%\.vscode\extensions\pml-aveva-e3d" "%CD%"

# Перезапустить VS Code
```

---

## Структура README на GitHub

Текущий `README.md` уже готов для GitHub:
- ✅ Описание функций
- ✅ Скриншоты (добавить позже)
- ✅ Инструкции по установке
- ✅ Примеры использования
- ✅ Настройки
- ✅ Лицензия

**Что добавить:**
```markdown
## 📥 Установка

### Из Releases (рекомендуется)
1. Скачать последний .vsix из [Releases](https://github.com/username/vscode-pml-extension/releases)
2. Установить: `code --install-extension pml-aveva-e3d-0.1.0.vsix`

### Из исходников
\`\`\`bash
git clone https://github.com/username/vscode-pml-extension.git
cd vscode-pml-extension
npm install && npm run compile
vsce package
code --install-extension pml-aveva-e3d-0.1.0.vsix
\`\`\`

## 🐛 Сообщить об ошибке
[Создать Issue](https://github.com/username/vscode-pml-extension/issues/new)
```

---

## Workflow для обновлений

### Обычный коммит

```bash
# После изменений
git add .
git commit -m "Add method sorting feature"
git push
```

### Новая версия

```bash
# 1. Обновить version в package.json
#    0.1.0 → 0.2.0

# 2. Обновить CHANGELOG.md
#    ## [0.2.0] - 2025-XX-XX
#    ### Добавлено
#    - Сортировка методов

# 3. Коммит
git add .
git commit -m "Release v0.2.0"
git push

# 4. Создать tag
git tag v0.2.0
git push origin v0.2.0

# 5. Собрать новый .vsix
npm run compile
vsce package

# 6. GitHub Release
# - Releases → Create release
# - Tag: v0.2.0
# - Прикрепить pml-aveva-e3d-0.2.0.vsix
```

---

## Автоматизация (опционально)

### GitHub Actions для автосборки

Создать `.github/workflows/build.yml`:

```yaml
name: Build Extension

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run compile
      - run: npx vsce package
      - uses: softprops/action-gh-release@v1
        with:
          files: '*.vsix'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Использование:**
```bash
# Push tag → автоматически создается Release с .vsix
git tag v0.2.0
git push origin v0.2.0
# GitHub Actions соберет и опубликует
```

---

## Документация для пользователей

### Добавить в README.md бейджи

```markdown
# PML for AVEVA E3D - VS Code Extension

![Version](https://img.shields.io/github/v/release/username/vscode-pml-extension)
![Downloads](https://img.shields.io/github/downloads/username/vscode-pml-extension/total)
![License](https://img.shields.io/github/license/username/vscode-pml-extension)
![Stars](https://img.shields.io/github/stars/username/vscode-pml-extension)
```

### Issues Templates

Создать `.github/ISSUE_TEMPLATE/bug_report.md`:

```markdown
---
name: Bug Report
about: Сообщить об ошибке
---

**Описание**
Краткое описание проблемы

**Как воспроизвести**
1. Открыть файл .pml
2. Сделать ...
3. Увидеть ошибку

**Ожидаемое поведение**
Что должно было произойти

**Скриншоты**
Если возможно

**Окружение:**
- OS: Windows/Linux/Mac
- VS Code версия: 
- Расширение версия: 

**Дополнительно**
Другая полезная информация
```

---

## Лицензия

Добавить файл `LICENSE`:

```
MIT License

Copyright (c) 2025 [Your Name]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## ⭐ Чеклист перед публикацией

- [ ] README.md заполнен (описание, примеры, установка)
- [ ] CHANGELOG.md обновлен
- [ ] package.json:
  - [ ] version правильная
  - [ ] repository URL указан
  - [ ] publisher заполнен (можно временный)
- [ ] LICENSE файл добавлен
- [ ] .gitignore настроен
- [ ] Код скомпилирован без ошибок
- [ ] .vsix собран и протестирован
- [ ] Git initialized и committed
- [ ] GitHub репозиторий создан
- [ ] Remote добавлен
- [ ] Push выполнен
- [ ] Release создан с .vsix файлом

---

## 📞 Поддержка

После публикации на GitHub:
- **Issues:** https://github.com/username/vscode-pml-extension/issues
- **Discussions:** https://github.com/username/vscode-pml-extension/discussions
- **Pull Requests:** Welcome!

---

*Последнее обновление: 2025-10-12*

