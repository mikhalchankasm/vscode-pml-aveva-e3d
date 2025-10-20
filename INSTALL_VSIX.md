# 📦 Установка расширения PML v0.5.1

## 🎯 Файл для установки

**VSIX пакет:** `pml-aveva-e3d-0.5.1.vsix` (15.39 MB)

---

## 📝 Способы установки

### Способ 1: Через командную строку (РЕКОМЕНДУЕТСЯ)

#### Для VSCode:
```bash
code --install-extension pml-aveva-e3d-0.5.1.vsix
```

#### Для Cursor:
```bash
cursor --install-extension pml-aveva-e3d-0.5.1.vsix
```

---

### Способ 2: Через UI VSCode/Cursor

1. Открыть VSCode или Cursor
2. Перейти в Extensions (Ctrl+Shift+X)
3. Нажать на `...` (три точки) в правом верхнем углу
4. Выбрать "Install from VSIX..."
5. Выбрать файл `pml-aveva-e3d-0.5.1.vsix`
6. Дождаться установки
7. Перезагрузить редактор (Reload Window)

---

### Способ 3: Drag & Drop (VSCode)

1. Открыть VSCode
2. Перетащить файл `pml-aveva-e3d-0.5.1.vsix` в окно VSCode
3. Подтвердить установку
4. Перезагрузить окно

---

## ✅ Проверка установки

После установки проверьте:

1. **Extensions список:**
   - Ctrl+Shift+X
   - Найдите "PML for AVEVA E3D" v0.5.1

2. **Откройте .pml файл:**
   - Должна работать подсветка синтаксиса
   - Новые keywords: `collect`, `all`, `with`, `compose`, `space`, `var`
   - $ prefix поддержка: `$!variable`

3. **Проверьте LSP функции:**
   - F12 - Go to Definition
   - Shift+F12 - Find References
   - Ctrl+Shift+O - Document Outline
   - Ctrl+Space - Completion
   - Hover на методах - документация

---

## 🐛 Troubleshooting

### Проблема: "Unable to install extension"
**Решение:**
- Удалите старую версию расширения
- Перезапустите VSCode/Cursor
- Попробуйте установить снова

### Проблема: Language Server не запускается
**Решение:**
- Откройте Output > PML Language Server
- Проверьте логи
- Перезагрузите окно (Ctrl+Shift+P → Reload Window)

### Проблема: Нет подсветки синтаксиса
**Решение:**
- Проверьте что файл имеет расширение `.pml` или `.pmlfrm`
- Внизу справа должно быть "PML"
- Если нет - нажмите на язык и выберите "PML"

---

## 📋 Что нового в v0.5.1

### Добавлено:
- ✅ PML1 Keywords: collect, all, with, compose, space
- ✅ $ prefix support: $!var, $!!global, $/ATTR
- ✅ Graceful parsing - NO false errors
- ✅ var, by, neq keywords
- ✅ Parameter type parsing: !width is REAL
- ✅ Knowledge base (15+ docs)

### Исправлено:
- ✅ Workspace indexing on Windows
- ✅ completionItem/resolve error
- ✅ Parser fixes для PML1 синтаксиса

---

## 🚀 Тестирование

После установки протестируйте на реальных PML файлах:

1. Откройте ваш PML проект
2. Проверьте что нет ложных ошибок (красных подчёркиваний)
3. Протестируйте IntelliSense:
   - Набирайте `.` после переменной - должны появиться методы
   - F12 на методе - должен перейти к определению
   - Ctrl+T - поиск по workspace

4. Проверьте новые фичи:
   - `var !x = value` - не должно быть ошибки
   - `do !i from 1 to 10 by -1` - поддержка by
   - `var !text compose |Hello| space |World|` - compose/space
   - `$!variable` - подсветка $ prefix

---

## 📞 Поддержка

**Issues:** https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/issues

**Документация:**
- [PROJECT_STATUS.md](PROJECT_STATUS.md) - текущий статус
- [PARSER_STRATEGY.md](docs/PARSER_STRATEGY.md) - graceful parsing
- [PML_LANGUAGE_VARIANTS.md](objects/PML_LANGUAGE_VARIANTS.md) - PML1 vs PML2

---

**Last Updated:** 2025-10-19
**Version:** 0.5.1
