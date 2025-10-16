# PML VS Code Extension - Статус бэклога

Сопоставление задач из `PML_VSCode_Extension_Backlog.md` с текущим статусом проекта.

---

## P0 — Core Language Support

### ✅ 1) Syntax Highlighting (TextMate grammar)
**Статус:** ✅ **РЕАЛИЗОВАНО** (v0.1.0)

**Что сделано:**
- ✅ 60+ ключевых слов: `define method`, `endmethod`, `setup form`, `exit`, etc.
- ✅ Переменные: `!local` и `!!global` подсвечиваются по-разному
- ✅ Строки: `'...'`, `|...|`, `"..."` 
- ✅ Комментарии: `--` и `$*`
- ✅ Типы: STRING, REAL, BOOLEAN, ARRAY, DBREF
- ✅ Операторы: eq, ne, gt, lt, and, or, not
- ✅ Встроенные функции: query, output, collectallfor, Evaluate

**Что НЕ сделано:**
- ❌ PML1 command-style lines (`Q ATT`, `NEW`, `UNMARK`)
- ❌ Gadget refs подсветка (`!!Form.gadget`)

**Файл:** `syntaxes/pml.tmLanguage.json`

---

### ❌ 2) Parser & AST (Tree-sitter)
**Статус:** ❌ **НЕ РЕАЛИЗОВАНО**

**Требуется:**
- Создать tree-sitter grammar для PML
- Парсинг в AST: methods, objects, forms, statements
- Incremental parsing
- Queries для symbols/highlights

**Сложность:** 🔴 **ВЫСОКАЯ** (отдельный проект)

**Альтернатива:** Пока используем regex-based подход (работает для 80% случаев)

---

### 🟡 3) Language Server (LSP) bootstrap
**Статус:** 🟡 **ЧАСТИЧНО РЕАЛИЗОВАНО**

**Что сделано (без LSP, напрямую в extension):**
- ✅ Document Symbols → outline методов/объектов/форм (Ctrl+Shift+O) - v0.1.1
- ✅ Hover → документация для builtins, keywords, operators - v0.1.0
- ✅ Completion → keywords, functions, types, attributes - v0.1.0
- ❌ Go To Definition
- ❌ Find References

**Файлы:** `src/symbols.ts`, `src/hover.ts`, `src/completion.ts`

**Что нужно для LSP:**
- Создать Language Server (отдельный процесс)
- Переместить логику из extension в server
- Требует: Tree-sitter (задача 2)

**Приоритет:** P1 (можно пока без LSP)

---

## P0 — Diagnostics (Linter) + Code Actions

### ✅ 4) Block pairing & structure checks
**Статус:** ✅ **РЕАЛИЗОВАНО** (v0.1.0)

**Что сделано:**
- ✅ Error если `define method` без `endmethod`
- ✅ Error если `define object` без `endobject`
- ✅ Error если `setup form` без `exit`
- ✅ Error если `if` без `endif`
- ✅ Error если `do` без `enddo`
- ✅ Error если `handle` без `endhandle`
- ❌ Warning на дубликаты имен методов
- ❌ Code Action: "Insert missing endmethod/exit"

**Файл:** `src/diagnostics.ts`

---

### ❌ 5) Arrays & type-usage checks
**Статус:** ❌ **НЕ РЕАЛИЗОВАНО**

**Требуется:**
- ⚠️ Warning на `!arr[0]` (массивы с 1)
- ⚠️ Warning на `.size()` для REAL
- ℹ️ Hint если переменная не инициализирована

**Сложность:** 🟡 **СРЕДНЯЯ** (требует type inference)

**Примечание:** Запланировано в TODO.md → "Type Inference для PML"

---

### ❌ 6) Forms/Callbacks validation
**Статус:** ❌ **НЕ РЕАЛИЗОВАНО**

**Требуется:**
- Error на неизвестный gadget в `!!Form.gadget`
- Warning если callback ссылается на несуществующий метод
- Quick Fix: "Generate callback stub method"

**Сложность:** 🟡 **СРЕДНЯЯ** (требует AST парсинг форм)

---

## P1 — Refactors & Navigation

### ❌ 7) Reorder Methods
**Статус:** ❌ **НЕ РЕАЛИЗОВАНО**

**Запланировано:** В TODO.md → "Сортировка методов" (высокий приоритет)

**Что нужно:**
- Команда: "PML: Reorder Methods" с UI picker
- Сохранение комментариев перед методами
- Код из ChatGPT файла можно адаптировать

**Сложность:** 🟢 **НИЗКАЯ** (код уже есть в ChatGPT файле)

**Файл:** Создать `src/methodSorter.ts`

---

### ❌ 8) Rename Symbol (safe)
**Статус:** ❌ **НЕ РЕАЛИЗОВАНО**

**Требуется:**
- Rename методов с обновлением всех вызовов
- Rename в callback strings
- Preview перед применением

**Сложность:** 🟡 **СРЕДНЯЯ** (требует Find References)

**Приоритет:** P1

---

### ❌ 9) Extract Method
**Статус:** ❌ **НЕ РЕАЛИЗОВАНО**

**Требуется:**
- Выделение → новый метод
- Автоматическая передача параметров

**Сложность:** 🔴 **ВЫСОКАЯ** (сложная логика)

**Приоритет:** P2 (nice-to-have)

---

## P1 — Snippets & Commands

### ✅ 10) Snippets: Form & callbacks
**Статус:** ✅ **РЕАЛИЗОВАНО** (v0.1.0)

**Что сделано:**
- ✅ Snippet `form` → setup form template
- ✅ Snippet `frame` → frame template
- ✅ Snippet `button`, `textfield`, `toggle`, `optionlist`
- ✅ Snippet `callback` → callback method template
- ✅ Snippet `handleform` → handle form events

**Файл:** `snippets/pml.json`

---

### ❌ 11) Snippets: EDG skeleton
**Статус:** ❌ **НЕ РЕАЛИЗОВАНО**

**Требуется:**
- Snippet для Event Driven Graphics
- EDG packet structure
- Picks + handlers

**Сложность:** 🟢 **НИЗКАЯ** (просто добавить в snippets)

---

### ❌ 12) Snippets: PML.NET callables
**Статус:** ❌ **НЕ РЕАЛИЗОВАНО**

**Требуется:**
- Template для PML↔.NET bridge
- C# class stub reference

**Сложность:** 🟢 **НИЗКАЯ**

---

### ❌ 13) Commands: Rehash/Reload/Show Form
**Статус:** ❌ **НЕ РЕАЛИЗОВАНО**

**Требуется:**
- "PML: Rehash All"
- "PML: Reload Current Form/Object"
- "PML: Show Form by Name"

**Сложность:** 🟡 **СРЕДНЯЯ** (требует интеграцию с AVEVA E3D)

**Примечание:** Требует настройку путей к E3D

---

## P1 — Settings & Formatter

### ❌ 14) Settings (paths & versions)
**Статус:** ❌ **НЕ РЕАЛИЗОВАНО**

**Требуется:**
- `pml.pmllibPaths` - пути к библиотекам
- `pml.uicPath` - путь к UIC
- `pml.addinsXmlPath` - путь к DesignAddins.xml
- `pml.e3dVersion` - версия E3D

**Сложность:** 🟢 **НИЗКАЯ**

---

### ✅ 15) Formatter (basic)
**Статус:** ✅ **РЕАЛИЗОВАНО** (v0.2.0+)

**Что сделано:**
- ✅ Indent blocks (исправление отступов)
- ✅ Align `=` operators (выравнивание присваиваний)
- ✅ Normalize spaces
- ✅ Preserve comments
- ✅ Format method/form blocks

**Файл:** `src/formatter.ts`

---

## P2 — Docs & Help

### ✅ 16) Inline Help (Hover docs)
**Статус:** ✅ **РЕАЛИЗОВАНО** (v0.1.0)

**Что сделано:**
- ✅ Hover на keywords (method, if, do, handle)
- ✅ Hover на builtins (query, output, collectallfor)
- ✅ Hover на операторах (eq, ne, gt, and, or)
- ✅ Примеры кода в hover

**Файл:** `src/hover.ts`

---

### ❌ 17) UIC Quick Actions
**Статус:** ❌ **НЕ РЕАЛИЗОВАНО**

**Требуется:**
- Command: "Open Project UIC"
- Snippet для XML entries

**Сложность:** 🟢 **НИЗКАЯ**

---

## P2 — Build/Deploy Integration

### ❌ 18) PML.NET Add-in: Build & Copy
**Статус:** ❌ **НЕ РЕАЛИЗОВАНО**

**Требуется:**
- Build DLL command
- Update DesignAddins.xml
- Copy to target

**Сложность:** 🟡 **СРЕДНЯЯ**

**Примечание:** Специфично для PML.NET workflow

---

## Quality & Tooling

### ❌ 19) Testing
**Статус:** ❌ **НЕ РЕАЛИЗОВАНО**

**Требуется:**
- Unit tests для formatter
- Tests для diagnostics
- Integration tests

**Приоритет:** P2 (после стабилизации функционала)

---

### 🟡 20) Performance & Robustness
**Статус:** 🟡 **ЧАСТИЧНО**

**Что сделано:**
- ✅ Diagnostics работают incremental
- ✅ Word-based completion работает быстро

**Что нужно:**
- Throttle/debounce для тяжелых операций
- Кэширование AST
- Worker threads для больших файлов

---

## 📊 Общий статус

### Реализовано (v0.2.4):
- ✅ Задача 1: Syntax Highlighting (95%)
- ✅ Задача 4: Block pairing checks (80%)
- ✅ Задача 10: Form snippets (100%)
- ✅ Задача 15: Formatter (100%)
- ✅ Задача 16: Hover docs (100%)
- 🟡 Задача 3: LSP features без LSP (50%)
- 🟡 Задача 20: Performance (70%)

### В разработке:
- 🔄 Задача 7: Reorder Methods (запланировано)
- 🔄 Задача 5: Type checks (запланировано в TODO.md)

### Не начато:
- ❌ Задача 2: Tree-sitter Parser (сложно, долго)
- ❌ Задача 6: Forms validation
- ❌ Задача 8: Rename Symbol
- ❌ Задача 9: Extract Method
- ❌ Задача 11-12: EDG, PML.NET snippets
- ❌ Задача 13: Runtime commands
- ❌ Задача 14: Settings paths
- ❌ Задача 17: UIC Quick Actions
- ❌ Задача 18: Build/Deploy
- ❌ Задача 19: Testing

---

## 🎯 Рекомендуемые приоритеты

### Следующие 2 недели (реально достижимо):

**1. Сортировка методов (Задача 7)** ⭐ ВЫСШИЙ ПРИОРИТЕТ
- Код уже есть в ChatGPT файле
- Очень полезная функция
- Низкая сложность
- **Оценка:** 2-4 часа

**2. EDG & PML.NET Snippets (Задачи 11-12)** 
- Просто добавить в `snippets/pml.json`
- **Оценка:** 30 минут

**3. Settings paths (Задача 14)**
- Добавить в `package.json` → configuration
- **Оценка:** 1 час

**4. UIC Quick Actions (Задача 17)**
- Команда "Open Project UIC"
- Snippet для XML
- **Оценка:** 2 часа

---

### Среднесрочные (1-2 месяца):

**5. Rename Symbol (Задача 8)**
- Базовый rename в файле
- **Оценка:** 1 неделя

**6. Arrays & type checks (Задача 5)**
- Warning на `!arr[0]`
- Базовый type inference
- **Оценка:** 1-2 недели

**7. Forms/Callbacks validation (Задача 6)**
- Проверка gadget refs
- Проверка callback methods
- **Оценка:** 1 неделя

---

### Долгосрочные (3+ месяца):

**8. Tree-sitter Parser (Задача 2)**
- Отдельный проект `tree-sitter-pml`
- **Оценка:** 1-3 месяца

**9. Full LSP (Задача 3)**
- Language Server Protocol
- Требует Tree-sitter
- **Оценка:** 2-4 месяца

**10. Extract Method (Задача 9)**
- Сложная логика
- **Оценка:** 2-3 недели

---

## 💡 Мои рекомендации

### Фокус на Quick Wins (P1):

**Неделя 1:**
- ✅ Сортировка методов (из ChatGPT)
- ✅ EDG Snippets
- ✅ PML.NET Snippets
- ✅ Settings paths

**Неделя 2:**
- ✅ UIC Quick Actions
- ✅ PML1 command-style подсветка
- ✅ Gadget refs подсветка

**Неделя 3-4:**
- ✅ Базовый type inference (warning на !arr[0])
- ✅ Forms/Callbacks validation

---

### Отложить (требуют много времени):

- ⏸️ Tree-sitter Parser (задача 2)
- ⏸️ Full LSP (задача 3)
- ⏸️ Extract Method (задача 9)
- ⏸️ Build/Deploy Integration (задача 18)
- ⏸️ Testing framework (задача 19)

---

## 📋 Обновленный TODO.md

Добавлю задачи из бэклога в TODO.md с приоритетами:

**P0 (Must Have):**
1. Сортировка методов ⭐
2. PML1 command-style подсветка
3. Warning на !arr[0]

**P1 (Should Have):**
4. EDG & PML.NET Snippets
5. Settings paths
6. UIC Quick Actions
7. Forms/Callbacks validation
8. Rename Symbol

**P2 (Nice to Have):**
9. Tree-sitter Parser
10. Full LSP
11. Extract Method
12. Build/Deploy Integration

---

## 🚀 Что делать прямо сейчас?

Хочешь чтобы я реализовал:

### Вариант A: Быстрые победы (2-4 часа)
1. **Сортировка методов** (код готов в ChatGPT файле)
2. **EDG Snippets**
3. **PML.NET Snippets**
4. **Settings paths**

### Вариант B: Средняя сложность (1-2 недели)
1. **Warning на !arr[0]** (базовый type inference)
2. **PML1 command-style подсветка**
3. **Forms/Callbacks validation**

### Вариант C: Продолжить тестирование
- Тестировать текущую версию
- Собирать feedback
- Исправлять баги

---

**Какой вариант выбираешь?** Или может что-то конкретное из списка?

