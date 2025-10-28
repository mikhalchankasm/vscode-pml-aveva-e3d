# Release Checklist

Обязательный чек-лист для публикации новой версии расширения.

## 📋 Pre-Release (Перед релизом)

### 1. Code Changes (Изменения кода)
- [ ] Все изменения протестированы локально
- [ ] Код скомпилирован без ошибок (`npm run compile`)
- [ ] Нет TypeScript ошибок
- [ ] Проверена работа в VS Code
- [ ] Проверена работа в Cursor (опционально)

### 2. Version Update (Обновление версии)
- [ ] Обновлён `package.json` -> `version` (например: `0.7.3` -> `0.7.4`)
- [ ] Обновлён `CHANGELOG.md`:
  - [ ] Добавлена новая секция с версией и датой
  - [ ] Перечислены все изменения (Added/Fixed/Changed/Removed)
  - [ ] Указаны технические детали
- [ ] Обновлён `ROADMAP.md` (если нужно):
  - [ ] Отмечены завершённые задачи
  - [ ] Обновлён раздел "Current Status"
  - [ ] Обновлена дата последнего изменения

### 3. Build VSIX (Сборка пакета)
- [ ] Выполнена команда: `npx @vscode/vsce package --no-yarn`
- [ ] Создан файл `pml-aveva-e3d-X.X.X.vsix`
- [ ] Проверен размер файла (должен быть ~15-16 MB)

## 🔧 Local Testing (Локальное тестирование)

### 4. Install & Test (Установка и тестирование)
- [ ] Установлена новая версия в VS Code:
  ```bash
  code --install-extension pml-aveva-e3d-X.X.X.vsix --force
  ```
- [ ] Установлена новая версия в Cursor (опционально):
  ```bash
  cursor --install-extension pml-aveva-e3d-X.X.X.vsix --force
  ```
- [ ] Протестированы основные функции:
  - [ ] Syntax highlighting работает
  - [ ] IntelliSense показывает методы
  - [ ] Go to Definition (F12) работает
  - [ ] Hover показывает документацию
  - [ ] Diagnostics показываются корректно
  - [ ] Нет новых ошибок/предупреждений

## 📤 Git Publication (Публикация в Git)

### 5. Commit & Push (Коммит и пуш)
- [ ] Удалены старые VSIX файлы из репозитория:
  ```bash
  git rm pml-aveva-e3d-*.vsix  # except latest
  ```
- [ ] Добавлены все изменения:
  ```bash
  git add -A
  ```
- [ ] Создан коммит с описательным сообщением:
  ```bash
  git commit -m "fix/feat: описание изменений (vX.X.X)"
  ```
- [ ] Изменения запушены:
  ```bash
  git push
  ```
- [ ] Проверен статус на GitHub (все файлы загружены)

## 🚀 GitHub Release (Создание релиза)

### 6. Create Release (Создание релиза на GitHub)

#### Вариант A: Через GitHub CLI (рекомендуется)
- [ ] Создан файл `RELEASE_NOTES_vX.X.X.md` с описанием изменений
- [ ] Выполнена команда:
  ```bash
  "C:\Program Files\GitHub CLI\gh.exe" release create vX.X.X pml-aveva-e3d-X.X.X.vsix --title "vX.X.X - Название релиза" --notes-file RELEASE_NOTES_vX.X.X.md
  ```
- [ ] Получена ссылка на релиз

#### Вариант B: Через веб-интерфейс
- [ ] Открыт https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases/new
- [ ] Заполнены поля:
  - [ ] **Tag version**: `vX.X.X`
  - [ ] **Release title**: `vX.X.X - Название релиза`
  - [ ] **Description**: Скопировано содержимое из `RELEASE_NOTES_vX.X.X.md`
- [ ] Загружен файл `pml-aveva-e3d-X.X.X.vsix`
- [ ] Нажата кнопка **Publish release**

### 7. Verify Release (Проверка релиза)
- [ ] Релиз появился на https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/releases
- [ ] VSIX файл доступен для скачивания
- [ ] Описание отображается корректно
- [ ] Ссылки работают

## ✅ Post-Release (После релиза)

### 8. Final Checks (Финальные проверки)
- [ ] Проверена главная страница репозитория
- [ ] README.md актуален (если были изменения)
- [ ] Создан issue для следующей версии (опционально)
- [ ] Обновлён проектный трекер (опционально)

### 9. Cleanup (Очистка)
- [ ] Удалены локальные VSIX файлы (оставить только последний):
  ```bash
  # Опционально - для экономии места
  rm pml-aveva-e3d-0.7.*.vsix  # except latest
  ```
- [ ] Проверен `.gitignore` (VSIX файлы не должны игнорироваться)

## 📝 Notes

### Быстрая команда для полного цикла релиза:

```bash
# 1. Update version in package.json manually
# 2. Update CHANGELOG.md manually
# 3. Compile and build
npm run compile
npx @vscode/vsce package --no-yarn

# 4. Install locally
code --install-extension pml-aveva-e3d-X.X.X.vsix --force

# 5. Test the extension...

# 6. Remove old VSIX and commit
git rm pml-aveva-e3d-*.vsix  # except latest
git add -A
git commit -m "release: vX.X.X"
git push

# 7. Create GitHub release
"C:\Program Files\GitHub CLI\gh.exe" release create vX.X.X pml-aveva-e3d-X.X.X.vsix --title "vX.X.X - Title" --notes-file RELEASE_NOTES_vX.X.X.md
```

### Semantic Versioning

Используем [Semantic Versioning](https://semver.org/):
- **MAJOR** (1.0.0): Несовместимые изменения API
- **MINOR** (0.1.0): Новые функции (обратно совместимые)
- **PATCH** (0.0.1): Исправления ошибок (обратно совместимые)

### Commit Message Format

Используем [Conventional Commits](https://www.conventionalcommits.org/):
- `feat: add new feature (vX.X.X)` - новая функция
- `fix: fix bug description (vX.X.X)` - исправление бага
- `docs: update documentation` - документация
- `chore: remove old files` - техническая работа
- `refactor: refactor code` - рефакторинг
- `perf: improve performance` - оптимизация

---

**Last Updated**: 2025-01-24
