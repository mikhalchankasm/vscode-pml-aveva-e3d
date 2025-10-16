# ⚡ Шпаргалка разработчика

## 🚀 Быстрые команды

```bash
# Компиляция
npm run compile

# Watch mode (автокомпиляция)
npm run watch

# Запуск для разработки
F5 в VS Code

# Собрать .vsix
vsce package

# Локальная установка
code --install-extension pml-aveva-e3d-0.1.0.vsix

# Git коммит
git add .
git commit -m "..."
git push
```

---

## 📁 Где что писать

| Что нужно | Куда писать |
|-----------|-------------|
| **Новое ключевое слово** | `syntaxes/pml.tmLanguage.json` |
| **Новый snippet** | `snippets/pml.json` |
| **Правило форматирования** | `src/formatter.ts` |
| **Проверка ошибок** | `src/diagnostics.ts` |
| **Автодополнение** | `src/completion.ts` |
| **Hover подсказка** | `src/hover.ts` |
| **Новая команда** | `src/extension.ts` + `package.json` |
| **Записать баг** | `TODO.md` → Баги |
| **Записать идею** | `TODO.md` → Новые функции |
| **Отметить сделанное** | `CHANGELOG.md` |

---

## 🔍 Структура TODO.md

```
TODO.md
├── 🐛 Баги и исправления
│   ├── Критичные (срочно)
│   ├── Некритичные
│   └── UX улучшения
│
├── 💡 Новые функции (приоритетные)
│   ├── 🔥 Сортировка методов ⭐
│   ├── Навигация (Symbol, Definition, Reference)
│   └── Refactoring
│
├── 🎯 Среднеприоритетные
│   ├── Snippets
│   ├── Документация
│   └── Визуальное
│
└── 🎨 Идеи для обсуждения
    ├── 🧠 Type Inference 🔬
    ├── LSP
    └── AVEVA Integration
```

---

## 📝 Workflow

### Добавить функцию
1. Записать в `TODO.md`
2. Написать код
3. `npm run compile`
4. `F5` → тестировать
5. Записать в `CHANGELOG.md`
6. `git commit`

### Исправить баг
1. Записать в `TODO.md` → Баги
2. Воспроизвести в `test.pml`
3. Исправить
4. `F5` → проверить
5. [x] отметить в `TODO.md`
6. `git commit`

### Релиз версии
1. Обновить version в `package.json`
2. Обновить `CHANGELOG.md`
3. `npm run compile`
4. `vsce package`
5. `git commit -m "Release v0.X.0"`
6. `git tag v0.X.0`
7. `git push && git push --tags`
8. GitHub Release + прикрепить .vsix

---

## 🎯 Текущие приоритеты

### Сейчас
- [ ] Протестировать v0.1.0
- [ ] Записать баги в TODO.md
- [ ] Исправить критичные баги

### Следующие 2 недели
- [ ] Сортировка методов (из ChatGPT)
- [ ] Symbol Provider
- [ ] Публикация на GitHub

### Этот месяц
- [ ] Definition Provider
- [ ] Type inference (базовый)

---

## 🐛 Debug

```typescript
// В коде
console.log('Debug message');
// Смотреть: Output → Extension Host

// Breakpoint
// F5 → ставить точки останова
```

---

## 📦 Сборка и установка

```bash
# Собрать .vsix (без иконки пока)
vsce package

# Установить в VS Code
code --install-extension pml-aveva-e3d-0.1.0.vsix

# Установить в Cursor
cursor --install-extension pml-aveva-e3d-0.1.0.vsix

# Установить в обе сразу
code --install-extension pml-aveva-e3d-0.1.0.vsix && cursor --install-extension pml-aveva-e3d-0.1.0.vsix

# Удалить расширение
code --uninstall-extension <publisher>.pml-aveva-e3d
cursor --uninstall-extension <publisher>.pml-aveva-e3d

# Переустановить после изменений
vsce package
code --install-extension pml-aveva-e3d-0.1.0.vsix
cursor --install-extension pml-aveva-e3d-0.1.0.vsix
```

**Важно:** Cursor и VS Code — разные программы! Нужно устанавливать в обе отдельно.

**Примечание:** Иконка опциональна, добавишь позже (см. TODO.md)

---

## 📦 GitHub

```bash
# Первый раз
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/USER/repo.git
git push -u origin main

# Обновления
git add .
git commit -m "..."
git push

# Release
git tag v0.2.0
git push origin v0.2.0
# + GitHub Release с .vsix
```

---

## 🔧 F5 vs Локальная установка

| F5 (Dev) | Локальная установка |
|----------|---------------------|
| ✅ Быстро | ⏱️ Нужно пересобирать |
| ✅ Автоперезагрузка | ❌ Нужно переустанавливать |
| ✅ Breakpoints | ❌ Нет отладки |
| ❌ Отдельное окно | ✅ В основном VS Code |
| **Для разработки** | **Для финального теста** |

---

## 📚 Документы

| Файл | Для чего |
|------|----------|
| `DEVELOPMENT.md` | Полная инструкция разработчика |
| `TODO.md` | Баги, фичи, идеи |
| `NEXT_STEPS.md` | Конкретный план действий |
| `CHANGELOG.md` | История версий |
| `README.md` | Для пользователей |
| `GITHUB_SETUP.md` | Как опубликовать |
| `QUICK_REFERENCE.md` | Эта шпаргалка |

---

## 🎨 Идеи из ChatGPT файла

### 1. Сортировка методов ⭐ ПРИОРИТЕТ
- A→Z, Z→A, по длине
- Интерактивная
- Submenu "PML Tools"

### 2. Type Inference 🔬
- `!pipe: Array<String>`
- Warning на `!arr[0]`
- Проверка `.Real()` на типах

### 3. Специфика PML
- Массивы с индексацией с 1
- Конверсии типов
- AVEVA атрибуты

---

## 💡 Горячие клавиши VS Code

| Действие | Клавиша |
|----------|---------|
| Открыть команды | `F1` или `Ctrl+Shift+P` |
| Форматировать | `Shift+Alt+F` |
| Автодополнение | `Ctrl+Space` |
| Outline методов | `Ctrl+Shift+O` |
| Перейти к определению | `F12` |
| Переименовать | `F2` |
| Problems панель | `Ctrl+Shift+M` |
| Terminal | `Ctrl+`` |
| Запуск расширения | `F5` |
| Перезагрузка расширения | `Ctrl+R` (в Dev окне) |

---

## ✅ Перед коммитом

- [ ] `npm run compile` без ошибок
- [ ] Протестировано в F5
- [ ] TODO.md обновлен
- [ ] CHANGELOG.md обновлен (если нужно)
- [ ] README.md обновлен (если публичная фича)

---

*Распечатай и держи под рукой! 📌*

