# Name Design Elements

## Table of Contents

- [Name Design Elements](#name-design-elements)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Naming Elements](#naming-elements)
    - [Special Syntax for Names](#special-syntax-for-names)
    - [NAME Command](#name-command)
      - [Command Syntax](#command-syntax)
    - [UNNAME Command](#unname-command)
    - [RENAME Command](#rename-command)
      - [Example](#example)
      - [Command Syntax](#command-syntax-1)
  - [Locking Elements](#locking-elements)
    - [Special Syntax for LOCK](#special-syntax-for-lock)
    - [LOCK Command](#lock-command)
      - [Examples](#examples)
    - [UNLOCK Command](#unlock-command)
      - [Command Syntax](#command-syntax-2)
  - [Related Pseudo Attributes](#related-pseudo-attributes)
  - [PML Attribute Class](#pml-attribute-class)
    - [Creation](#creation)
    - [Methods](#methods)

---

## Overview

All elements except the WORLD can be named. Although Design elements are often given suitable names while being created, later name changes can be made by giving a new name or by removing the old name. The name of any element must be unique; that is, not already used for another currently accessible element.

---

## Naming Elements

### Special Syntax for Names

Naming design elements allows for better organization and identification within the project structure.

### NAME Command

The NAME command assigns a name to the current element, provided the name has not been used elsewhere.

| Example      | Description                                                                                     |
|--------------|-------------------------------------------------------------------------------------------------|
| NAME /ZONE5D | The current element is given the specified name provided it has not been used elsewhere.        |

#### Command Syntax

```
>-- NAMe --+-- ALL name name --. |                   | '-- name -----------+--> >-- UNName -->
```

### UNNAME Command

The UNNAME command removes the name from the current element, making it unnamed but still identifiable by its automatically allocated reference number.

| Example | Description                                                                                     |
|---------|-------------------------------------------------------------------------------------------------|
| UNN     | The current element loses its name (it is still identifiable by its automatically allocated reference number). |

### RENAME Command

The name of the current element and offspring can be modified where a standard name part occurs.

#### Example

```
REN ALL /Z1 /Z2
```

All occurrences of /Z1 in the names of the current element and its offspring will be changed to /Z2.

#### Command Syntax

```
>-- REName --+-- ALL name name --. |                   | '--name -----------+-->
```

---

## Locking Elements

### Special Syntax for LOCK

### LOCK Command

Locking a design element prevents it from being modified or deleted. The LOCK command allows either a single element to be controlled, or all its offspring too. (A complete Site can be locked if required.) This provides you with personal security control over your area of work. (General security restrictions affecting the whole Project are established in the Admin module of AVEVA E3D Design.)

#### Examples

```
LOCK ALL
```

The current element and all its offspring are locked.

### UNLOCK Command

The UNLOCK command removes the lock protection from the current element.

| Command | Description                      |
|---------|----------------------------------|
| UNLOCK  | The current element is unlocked. |

#### Command Syntax

```
LOCK command syntax would be documented here
```

---

## Related Pseudo Attributes

These pseudo attributes provide information about the modification status and permissions of elements.

| Attribute Name | Data Type   | Qualifier | Description                                                       |
|----------------|-------------|-----------|-------------------------------------------------------------------|
| DACMOD         | BOOL        | ATTR      | True if DAC allows attribute of element to be modified            |
| MODATT         | BOOL        | ATTR      | True if attribute of element can be modified                      |
| MODERR         | STRING(120) | ATTR      | Returns the error text that would occur if attribute was modified |

---

## PML Attribute Class

Information is provided on the creation of attribute classes and the creation methods.

### Creation

A Programmable Macro Language (PML) attribute instance may be created for a system attribute or a User defined Attribute (UDA).

```
!AXLEN = object attribute('XLEN')
!UINT = object attribute(':UINT')
```

The class should not be confused with the attribute value. The actual Attribute value for a particular Element can only be accessed via the DBREF class or via the QUERY command. Comparing two Attributes just compares whether they identify the same attribute, the comparison does not look at attribute values in any way.

### Methods

The Attribute instance can then be used for querying the 'meta data', that means, data about data. The methods of the class allow the following to be queried.

[Additional method documentation would be included here]
