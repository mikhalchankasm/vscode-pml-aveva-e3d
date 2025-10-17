# Roadmap - PML for AVEVA E3D Extension

Планы развития расширения на ближайшие релизы.

---

## ✅ v0.4.8 (Текущая версия)

- ⚡ Code Actions Provider (лампочка 💡)
- 🎯 Quick Actions в контекстном меню
- Команды сгруппированы (Array, Sort, Remove, Trim)

---

## 🎯 v0.5.0 (Следующий релиз) - Q1 2025

### Навигация и рефакторинг

- [ ] **Сортировка методов A→Z/Z→A** ⭐ ВЫСОКИЙ ПРИОРИТЕТ
  - Команда "PML: Sort Methods (A→Z)"
  - Парсинг `define method ... endmethod` блоков
  - Сохранение комментариев перед методами

- [ ] **Улучшенный Go to Definition**
  - Переход между файлами
  - Поддержка методов в других .pml файлах

- [ ] **Find All References для методов**
  - Поиск всех использований метода
  - Показ в панели References

### Snippets и команды

- [ ] **EDG Snippets** (Event Driven Graphics)
  - Snippet для EDG packet
  - Picks + handlers шаблоны

- [ ] **PML.NET Snippets**
  - Template для PML↔.NET bridge
  - C# class stub reference

### UX улучшения

- [ ] **Settings для путей**
  - `pml.pmllibPaths` - пути к библиотекам
  - `pml.uicPath` - путь к UIC
  - `pml.e3dVersion` - версия E3D

- [ ] **Reload Form команда улучшена**
  - Автоматический запуск в AVEVA (если настроен путь)

---

## 🚀 v0.6.0 - Q2 2025

### Type Inference и диагностика

- [ ] **Warning на !arr[0]** ⭐
  - "PML arrays are 1-indexed, not 0-indexed"
  - Quick fix: "Change to !arr[1]"

- [ ] **Базовый Type Inference**
  - Определение типов переменных из присваиваний
  - `!var = STRING()` → type: STRING
  - `!arr[1] = 'value'` → type: ARRAY<STRING>

- [ ] **Type-aware автодополнение**
  - `!str.` → показывать только STRING методы
  - `!arr[1].` → методы элемента массива

### Forms/Callbacks валидация

- [ ] **Проверка gadget refs**
  - Error на неизвестный gadget в `!!Form.gadget`
  - Автодополнение gadget names

- [ ] **Проверка callback methods**
  - Warning если callback ссылается на несуществующий метод
  - Quick Fix: "Generate callback stub method"

---

## 🔥 v0.7.0 - Q3 2025

### Refactoring

- [ ] **Rename Symbol (safe)**
  - Переименование методов с обновлением всех вызовов
  - Rename в callback strings
  - Preview перед применением

- [ ] **Extract Method**
  - Выделение → новый метод
  - Автоматическая передача параметров

### Integration

- [ ] **AVEVA E3D Integration** (если возможно)
  - Task Provider для запуска PML
  - Интеграция с PML Console
  - Выполнение скриптов напрямую

---

## 🌟 v1.0.0 - Q4 2025

### Language Server Protocol (LSP)

- [ ] **Tree-sitter Parser для PML**
  - Отдельный проект `tree-sitter-pml`
  - Парсинг в AST
  - Queries для symbols/highlights

- [ ] **Full LSP Implementation**
  - Semantic analysis
  - Advanced refactoring
  - Performance для больших файлов

### Quality и тестирование

- [ ] **Unit tests**
  - Formatter tests
  - Diagnostics tests
  - Completion tests

- [ ] **Integration tests**
  - End-to-end тесты

- [ ] **Documentation полная**
  - Все команды документированы
  - Примеры для каждой функции
  - Video tutorials

---

## 📚 Постоянные задачи

### Documentation

- [ ] GIF демки для каждой функции
- [ ] Видео туториал (60-90 сек)
- [ ] docs/commands.md, settings.md, snippets.md
- [ ] PML Cheatsheet
- [ ] Перевод документации на английский

### Community

- [ ] GitHub Discussions
- [ ] good first issue labels
- [ ] Contributing guidelines
- [ ] Community showcase

### Quality

- [ ] CI/CD улучшения
- [ ] Тесты покрытие
- [ ] Performance оптимизации
- [ ] Accessibility

---

## 🤔 Идеи для обсуждения (возможно v2.0+)

### Большие фичи

- [ ] **Debugger Adapter**
  - Отладка PML (если API доступен)
  - Breakpoints, Watch variables, Call stack

- [ ] **AVEVA E3D Database Browser**
  - Просмотр элементов БД
  - Синхронизация с сессией E3D

- [ ] **Visual Form Designer**
  - WYSIWYG редактор форм
  - Drag & Drop gadgets

### Advanced Features

- [ ] Semantic Highlighting
- [ ] Code Lens (показывать количество использований)
- [ ] Inlay Hints (показывать типы переменных)
- [ ] Workspace Symbols (поиск по всем файлам проекта)

---

## 📊 Метрики успеха

### v1.0.0
- 1000+ активных установок
- 50+ GitHub stars
- Рейтинг 4.5+/5
- < 5 открытых критичных issues
- Полная документация
- Community активное

---

## 💬 Feedback

Есть идеи или предложения? Создай:
- 🐛 [Bug Report](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/issues/new?template=bug_report.yml)
- ✨ [Feature Request](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/issues/new?template=feature_request.yml)
- 💬 [Discussion](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/discussions) (скоро)

---

*Последнее обновление: 2025-01-17*
*Roadmap может меняться в зависимости от feedback и приоритетов*

