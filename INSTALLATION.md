# 📥 Установка расширения PML для VS Code

## Для пользователей (на любом компьютере)

### Вариант 1: Через командную строку ⚡ (быстро)

```bash
# 1. Скачайте файл pml-aveva-e3d-0.1.0.vsix
# 2. Откройте терминал/командную строку в папке с файлом
# 3. Выполните:

code --install-extension pml-aveva-e3d-0.1.0.vsix
```

**Windows PowerShell:**
```powershell
cd "C:\путь\к\папке\с\файлом"
code --install-extension pml-aveva-e3d-0.1.0.vsix
```

**Windows CMD:**
```cmd
cd C:\путь\к\папке\с\файлом
code --install-extension pml-aveva-e3d-0.1.0.vsix
```

---

### Вариант 2: Через интерфейс VS Code 🖱️ (без командной строки)

1. Откройте **VS Code**
2. Нажмите **Extensions** (или `Ctrl+Shift+X`)
3. Кликните **`...`** (три точки в правом верхнем углу панели Extensions)
4. Выберите **"Install from VSIX..."**
5. Найдите и выберите файл `pml-aveva-e3d-0.1.0.vsix`
6. Перезапустите VS Code

✅ **Готово!** Расширение установлено.

---

### Вариант 3: Скачать с GitHub (после публикации)

1. Перейдите на https://github.com/YOUR_USERNAME/vscode-pml-extension/releases
2. Скачайте последнюю версию `.vsix` файла
3. Установите одним из способов выше

---

## Для Cursor IDE

Тот же процесс, но используйте команду `cursor` вместо `code`:

```bash
cursor --install-extension pml-aveva-e3d-0.1.0.vsix
```

Или через UI Cursor:
1. Extensions → `...` → Install from VSIX

---

## Проверка установки

После установки:

1. Откройте файл с расширением `.pml`, `.pmlfrm` или `.pmlfnc`
2. Проверьте:
   - ✅ Подсветка синтаксиса работает
   - ✅ Snippets доступны (наберите `method` и нажмите Tab)
   - ✅ Автодополнение работает (Ctrl+Space)
   - ✅ Hover подсказки появляются при наведении мыши
   - ✅ Форматирование работает (Shift+Alt+F)

---

## Обновление расширения

При выходе новой версии:

### Способ 1: Удалить и переустановить

```bash
# Удалить старую версию
code --uninstall-extension your-publisher.pml-aveva-e3d

# Установить новую
code --install-extension pml-aveva-e3d-0.2.0.vsix
```

### Способ 2: Просто переустановить (перезапишет)

```bash
code --install-extension pml-aveva-e3d-0.2.0.vsix
```

VS Code автоматически заменит старую версию на новую.

---

## Удаление расширения

### Через командную строку:

```bash
code --uninstall-extension your-publisher.pml-aveva-e3d
```

### Через UI:

1. Extensions (`Ctrl+Shift+X`)
2. Найдите "PML for AVEVA E3D"
3. Нажмите **Uninstall**

---

## Системные требования

- **VS Code**: версия 1.80.0 или выше
- **Cursor IDE**: версия 1.0.0 или выше (опционально)
- **Операционная система**: Windows, Linux, macOS

---

## Частые проблемы

### "code is not recognized as a command"

**Решение:** VS Code не добавлен в PATH.

**Windows:**
1. Переустановите VS Code
2. При установке отметьте "Add to PATH"

Или установите через UI (Вариант 2)

---

### Расширение не активируется

**Решение:**
1. Перезапустите VS Code
2. Откройте файл `.pml`
3. Проверьте: View → Extensions → найдите расширение, оно должно быть "Enabled"

---

### Не работает подсветка синтаксиса

**Решение:**
1. Убедитесь что файл имеет правильное расширение: `.pml`, `.pmlfrm`, `.pmlfnc`
2. В правом нижнем углу VS Code кликните на язык и выберите "PML"

---

## Поддержка

- **Баги:** https://github.com/YOUR_USERNAME/vscode-pml-extension/issues
- **Документация:** См. README.md в репозитории
- **Вопросы:** Создайте Issue на GitHub

---

## Лицензия

MIT License - свободное использование в коммерческих и некоммерческих целях.

---

*Версия документа: 1.0*
*Последнее обновление: 2025-10-12*

