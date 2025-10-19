# 📚 PML Knowledge Base

Эта папка содержит полную документацию по PML (Programmable Macro Language) для AVEVA E3D.

## 📋 Структура

| Файл | Статус | Методов | Описание |
|------|--------|---------|----------|
| [array object.md](array%20object.md) | ✅ Готово | 48 | Методы ARRAY объекта |
| [string object.md](string%20object.md) | ⏳ TODO | ~30 | Методы STRING объекта |
| [real object.md](real%20object.md) | ⏳ TODO | ~20 | Методы REAL объекта |
| [boolean object.md](boolean%20object.md) | ⏳ TODO | ~5 | Методы BOOLEAN объекта |
| [dbref object.md](dbref%20object.md) | ⏳ TODO | ~15 | Методы DBREF объекта |
| [builtin functions.md](builtin%20functions.md) | ⏳ TODO | ~50 | Глобальные функции PML |
| [keywords.md](keywords.md) | ⏳ TODO | ~40 | Ключевые слова языка |
| [operators.md](operators.md) | ⏳ TODO | ~20 | Операторы (eq, ne, and, or, etc.) |

## 🎯 Формат файлов

### Для объектов (types):

```markdown
{TYPE} Object

| Name | Parameters | Result | Purpose |
|------|------------|--------|---------|
| MethodName(PARAM_TYPE param) | param - описание | RETURN_TYPE | Описание функционала метода |

**Примеры:**
...pml code examples...
```

### Для функций:

```markdown
Builtin Functions

| Name | Parameters | Result | Purpose |
|------|------------|--------|---------|
| FunctionName(TYPE param) | param - описание | RETURN_TYPE | Описание |
```

### Для keywords:

```markdown
PML Keywords

| Keyword | Category | Usage | Example |
|---------|----------|-------|---------|
| define | Declaration | Объявление метода/объекта | define method .foo() |
```

## 🔧 Интеграция с расширением

Эти файлы используются для:

1. **Hover Provider** - показ документации при наведении
2. **Signature Help** - подсказки параметров
3. **Completion Provider** - автодополнение методов
4. **Diagnostics** - проверка типов и существования методов

## 📝 Как добавить новый метод

1. Открыть соответствующий файл (например, `string object.md`)
2. Добавить строку в таблицу:
   ```markdown
   | NewMethod(STRING param) | param - описание | STRING | Что делает метод |
   ```
3. Добавить примеры (опционально)
4. Сохранить файл
5. Расширение автоматически подхватит изменения (в будущем)

## 🎨 Приоритеты заполнения

### Высокий приоритет (нужны сейчас):
1. **string object.md** - самый используемый тип
2. **builtin functions.md** - compose, space, writefile, и др.
3. **keywords.md** - var, compose, space, by, neq

### Средний приоритет:
4. **real object.md** - математические операции
5. **dbref object.md** - работа с БД AVEVA

### Низкий приоритет:
6. **boolean object.md** - мало методов
7. **operators.md** - уже частично в коде

---

**Last Updated:** 2025-10-19
