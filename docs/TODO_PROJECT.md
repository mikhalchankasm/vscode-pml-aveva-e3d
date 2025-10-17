# Project TODOs - Infrastructure & Documentation

Задачи по улучшению проекта (не features расширения).

## 🚀 Высокий приоритет (сделать в ближайшее время)

### Визуальный контент

- [ ] **3 GIF-демки** (≤10 MB каждая) ⭐ КРИТИЧНО
  - [ ] GIF 1: Code Actions (лампочка 💡) - Array, Sort, Remove
  - [ ] GIF 2: Автодополнение и Hover документация
  - [ ] GIF 3: Форматирование и PML Tools меню
  - Инструменты: LICEcap, ScreenToGif, Gifski
  - Разместить в верх README.md

- [ ] **Скриншоты** для Marketplace
  - [ ] Подсветка синтаксиса (до/после)
  - [ ] Outline с методами
  - [ ] Quick Actions меню
  - [ ] Автодополнение в действии
  - Папка: `images/screenshots/`

- [ ] **Иконка расширения**
  - 128×128 PNG (для Marketplace)
  - Оптимизировать текущую `icons/pml-icon.png` (сейчас 1.84 MB!)
  - Создать варианты: 32x32, 64x64, 128x128

- [ ] **Banner для Marketplace**
  - 1400×400 PNG
  - Текст: "PML for AVEVA E3D - IntelliSense, Formatting, Tools"
  - Сохранить: `images/banner.png`

### Бейджи в README

- [ ] Добавить бейджи вверх README.md:
  ```markdown
  [![Version](https://img.shields.io/visual-studio-marketplace/v/mikhalchankasm.pml-aveva-e3d)](...)
  [![Installs](https://img.shields.io/visual-studio-marketplace/i/mikhalchankasm.pml-aveva-e3d)](...)
  [![Rating](https://img.shields.io/visual-studio-marketplace/r/mikhalchankasm.pml-aveva-e3d)](...)
  [![CI](https://github.com/mikhalchankasm/vscode-pml-aveva-e3d/workflows/CI/badge.svg)](...)
  [![License](https://img.shields.io/github/license/mikhalchankasm/vscode-pml-aveva-e3d)](LICENSE)
  ```

### Документация фич

- [ ] **docs/commands.md** - список всех команд
  - Command ID
  - Клавиатурные сокращения
  - Где найти в меню
  - Примеры использования

- [ ] **docs/settings.md** - все настройки
  - `pml.formatter.*`
  - `pml.trace`
  - Примеры JSON конфигурации

- [ ] **docs/snippets.md** - список snippets
  - Триггер → что генерит
  - Таблица с примерами

- [ ] **docs/pml-cheatsheet.md** - шпаргалка
  - Типы PML (STRING, REAL, ARRAY, DBREF)
  - Операторы (eq, ne, gt, and, or)
  - Встроенные функции (query, output, collectallfor)
  - Массивы (индексация с 1!)
  - Формы и callbacks
  - EDG basics

---

## 🟡 Средний приоритет

### Контент

- [ ] **Видео туториал (60-90 сек)**
  - Установка + 3 главные функции
  - YouTube + ссылка в README
  - Возможно Telegram канал

- [ ] **Примеры проектов**
  - `example-project/` - песочница для теста
  - 4-6 реальных PML файлов с комментариями
  - pmlfrm/pmlfnc/pmlcmd/pmlobj примеры

- [ ] **Recipes / Cookbook**
  - `docs/recipes/` папка
  - Сортировка методов
  - Генерация шаблона формы
  - Быстрый EDG-пакет
  - Работа с массивами

### Публикация

- [ ] **package.json - улучшения**
  - Заполнить `keywords`: aveva, e3d, pml, pdms, macro, industrial-bim
  - Добавить `categories`: Programming Languages, Snippets, Linters, Formatters
  - `galleryBanner`: {"color": "#0066CC", "theme": "dark"}
  - Проверить `publisher`, `repository`, `bugs`, `homepage`

- [ ] **Open VSX публикация**
  - `ovsx publish` в release.yml
  - Токен для Open VSX Registry

- [ ] **Marketplace README**
  - Отдельный README.md для Marketplace (если нужно)
  - Больше визуала, меньше текста

### Community

- [ ] **GitHub Discussions включить**
  - Q&A категория
  - Ideas & Feature Requests
  - Show & Tell

- [ ] **good first issue labels**
  - Создать 2-3 simple issues
  - Label: `good first issue`, `help wanted`

- [ ] **CODEOWNERS**
  - Кто ревьюит grammar/LSP/docs

---

## 🟢 Низкий приоритет (когда будет время)

### Advanced Documentation

- [ ] **docs/lsp.md** (когда будет LSP)
  - Функции (hover, defs, symbols, diagnostics)
  - Протокол

- [ ] **docs/grammar.md**
  - Что покрывает TextMate
  - Известные ограничения
  - Как добавить новые паттерны

- [ ] **TELEMETRY.md**
  - Список событий (если будет телеметрия)
  - Как отключить
  - Никакой PII

- [ ] **PRIVACY.md**
  - Что НЕ собираем
  - Простым языком

### Quality

- [ ] **devcontainer/**
  - Контейнер для контрибьюторов
  - Node + vsce + ovsx

- [ ] **Grammar tests**
  - `.github/workflows/grammar-tests.yml`
  - Snapshot тесты подсветки

- [ ] **CITATION.cff**
  - Для академических ссылок

### SEO и распространение

- [ ] **Темы репозитория** (GitHub)
  - `vscode-extension`, `pml`, `aveva`, `e3d`, `pdms`, `industrial-bim`

- [ ] **Перевод документации**
  - README.md на английский (уже есть README.en.md, обновить)
  - FAQ на английский
  - CONTRIBUTING на английский

- [ ] **Сравнение до/после**
  - Скриншоты: код без расширения vs с расширением

---

## ✅ Уже сделано

- [x] LICENSE (MIT)
- [x] CHANGELOG.md (SemVer)
- [x] CONTRIBUTING.md
- [x] CODE_OF_CONDUCT.md
- [x] SECURITY.md
- [x] FAQ.md
- [x] ROADMAP.md
- [x] .github/ISSUE_TEMPLATE/bug_report.yml
- [x] .github/ISSUE_TEMPLATE/feature_request.yml
- [x] .github/PULL_REQUEST_TEMPLATE.md
- [x] .github/workflows/ci.yml
- [x] .github/workflows/release.yml
- [x] examples/ (9 файлов)
- [x] docs/ (15+ файлов)

---

## 📝 Заметки

### Инструменты для GIF

- **LICEcap** (Windows/Mac) - простой, легкий
- **ScreenToGif** (Windows) - много функций, редактор
- **Gifski** - конвертер видео в GIF (высокое качество)
- **ShareX** (Windows) - скриншоты + GIF + видео

### Оптимизация GIF

```bash
# Сжатие GIF (gifsicle)
gifsicle -O3 --lossy=80 input.gif -o output.gif

# Или онлайн: ezgif.com/optimize
```

### Размер иконки

Текущая `icons/pml-icon.png` = 1.84 MB - **слишком большая!**

Оптимизировать:
```bash
# ImageMagick
convert pml-icon.png -resize 128x128 -quality 85 pml-icon-optimized.png

# TinyPNG API или онлайн: tinypng.com
```

Целевой размер: < 100 KB

---

*Обновляй по мере выполнения!*

