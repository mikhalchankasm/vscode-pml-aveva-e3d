# PML Attribute Class

## Table of Contents

- [PML Attribute Class](#pml-attribute-class)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Creation](#creation)
  - [Methods](#methods)
    - [Basic Information Methods](#basic-information-methods)
    - [Type and Classification Methods](#type-and-classification-methods)
    - [Value and Validation Methods](#value-and-validation-methods)
    - [Behavioral Properties](#behavioral-properties)

---

## Overview

Information is provided on the creation of attribute classes and the creation methods. The PML Attribute Class allows querying metadata about system and user-defined attributes.

---

## Creation

A Programmable Macro Language (PML) attribute instance may be created for a system attribute or a User defined Attribute (UDA).

```
!AXLEN = object attribute('XLEN')
!UINT = object attribute(':UINT')
```

**Important Note:** The class should not be confused with the attribute value. The actual Attribute value for a particular Element can only be accessed via the DBREF class or via the QUERY command. Comparing two Attributes just compares whether they identify the same attribute, the comparison does not look at attribute values in any way.

---

## Methods

The Attribute instance can then be used for querying the 'meta data', that means, data about data. The methods of the class allow the following to be queried.

### Basic Information Methods

| Method                       | Return Type | Description                                                    |
|------------------------------|-------------|----------------------------------------------------------------|
| `String Type()`              | String      | Attribute type                                                 |
| `String Name()`              | String      | Attribute name                                                 |
| `String Description()`       | String      | Attribute description                                          |
| `Int Hash()`                 | Int         | Attribute hash value                                           |
| `int Length()`               | int         | Attribute length                                               |
| `string querytext()`         | string      | As output at the command line when querying attribute          |

### Type and Classification Methods

| Method                       | Return Type | Description                                                                                                                   |
|------------------------------|-------------|-------------------------------------------------------------------------------------------------------------------------------|
| `bool IsPseudo()`            | bool        | Whether pseudo or not                                                                                                          |
| `bool IsUda()`               | bool        | Whether a User defined Attributes (UDA) or not                                                                                |
| `string units`               | string      | Either BORE, DISTANCE or NONE. Returns the unit field of the attribute which is the string of the hash code of the dimension of the attribute (BORE, DIST, MASS, ANGL, or for numbers of no physical quantity NONE). For UDAs it is the value of the UDA Type (UTYP) attribute. |
| `string Category()`          | string      | Determines the grouping of attributes on the 'Attribute Utility' form                                                         |

### Value and Validation Methods

| Method                       | Return Type        | Description                                                                 |
|------------------------------|--------------------|-----------------------------------------------------------------------------|
| `bool Noclaim()`             | bool               | Whether attribute can be changed without doing a claim                     |
| `ElementType array ElementTypes` | ElementType array | List of Elements for which the attribute is valid. This only works for UDAs |
| `Real array limits`          | Real array         | Min/Max values for real/int types                                          |
| `String array ValidValues(ElementType)` | String array | List of valid for text attributes. The list may vary with element type      |
| `string DefaultValue (ElementType)` | string            | Attribute default. This only works for UDAs                               |

### Behavioral Properties

| Method                       | Return Type | Description                                                                  |
|------------------------------|-------------|------------------------------------------------------------------------------|
| `bool hyperlink()`           | bool        | If true then the attribute value refers to an external file                  |
| `bool connection()`          | bool        | If true then the attribute value will appear on the reference list form      |
| `bool hidden()`              | bool        | If true then attribute will not appear on the Attribute utility form or after 'Q ATT' |
| `bool protected()`           | bool        | If true then attribute is not visible if a protected                        |

