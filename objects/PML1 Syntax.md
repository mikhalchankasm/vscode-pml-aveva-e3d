# PML1 Syntax

## Table of Contents

1. [Basic Syntax](#basic-syntax)
2. [VAR Command](#var-command)
3. [OF Syntax](#of-syntax)
4. [Query Arrays](#query-arrays)
5. [Dot Notation in PML](#dot-notation-in-pml)
6. [Qualifiers](#qualifiers)
7. [Relative Positions, Directions, Orientations](#relative-positions-directions-orientations)
8. [Pseudo Attributes](#pseudo-attributes)
   - [Related to List of Attributes](#pseudo-attributes-relating-to-the-list-of-attributes)
   - [Related to Name](#pseudo-attributes-relating-to-the-name)
   - [Related to Type](#pseudo-attributes-relating-to-the-type)
9. [Set Attributes](#set-attributes)
   - [Standard Syntax](#standard-syntax)
   - [Set a UDA Back to Default](#set-a-uda-back-to-a-default)
   - [Set an Array](#set-an-array)
   - [Single Value of an Array](#single-value-of-an-array)

---

## Basic Syntax

PML1 syntax allows an attribute to be passed to a PML variable without the '=' operator. If this is done then the value will always be formatted to a TEXT using the current units if applicable.

```
VAR !RESULT XLEN
```

!RESULT will be of type TEXT

The VAR command has many forms but in all cases it creates PML STRING variables, not Numbers. If the contents are values and numbers then where these are physical quantities they will be appended with the units of the values as stored in the system.

```
VAR !RESULT XLEN
```

Will store the text equivalent of the value of the XLEN attribute in current distance units.

```
Q VAR !!CE.XLEN
```

Will return the text string form of !!CE.XLEN. It does this by using the STRING (actually queryString) method of the (temporary) real variable created by !!CE.XLEN. The real variable will be created in current units and the STRING method will append the unit qualifier to the value output

```
<REAL> 18.1102362204724in
```

---

## VAR Command

The VAR command creates PML STRING variables. When the contents are values and numbers, physical quantities will be appended with the units of the values as stored in the system.

### Examples:

- Text equivalent of attribute value:
  ```
  VAR !RESULT XLEN
  ```

- Query with current units:
  ```
  Q VAR !!CE.XLEN
  ```

---

## OF Syntax

Attributes may be queried on other elements by using the 'OF' syntax.

```
Q XLEN of /MYBOX
!RESULT = XLEN OF /MYBOX
```

The syntax following the OF may be any ID expression.

```
!RESULT = XLEN of NEXT BOX
!RESULT = DESC OF CREF
```

---

## Query Arrays

If the attribute is an array, the query will return a list of values. Individual elements can be queried by passing in the index number.

```
!VALUE = !!CE.DESP[2]
!VALUE = DESP[2]
```

Alternatively, the NUM keyword can be used for PML 1 syntax. A range of values can be returned using the TO keyword.

```
VAR !VALUE DESP NUM 3 - to retrieve the 3rd value
VAR !VALUE DESP NUM 3 TO 5 - to retrieve 3rd to 5th values
Q DESP NUM 3 TO 5
```

An error will occur if attempting to query off the end of the array.

Within a PML1 expression, a position attribute may be queried as an array in order to access the individual coordinates.

```
VAR !X (POS[1] ) - This will return the X coordinate.
```

---

## Dot Notation in PML

For reference attributes, the Programmable Macro Language (PML) dot notation can be used to achieve a similar result.

```
!RESULT = !!CE.ATTRIBUTE('CREF').DESC
```

This will return the description of the element pointed to by the CREF attribute on the Current Element (CE).

---

## Qualifiers

Many pseudo attributes take a qualifier. The qualifier is the extra information required to make the query. Examples of where a qualifier is used are:

1. Querying a ppoint position (PPOS) requires the ppoint number
2. The ATTMOD attribute can be used to query when an attribute was modified. The qualifier is the attribute to test for modification.
3. A direction/position may be queried wrt another element.

The definition of what pseudo attributes take what qualifier is described in the data model reference manual.

The qualifier follows the attribute name in brackets. Attribute qualifiers must be preceded by the keyword ATTNAME and element types must be preceded by the keyword TYPENAME.

```
Q PPOS(1) - PPOS has an int qualifier
Q LASTMOD(ATTNAME XLEN) - LASTMOD has an attribute qualifier
Q LASTMOD(TRUE) - When at an ENGITE, LASTMOD is checked against all linked items and uses the most recent date of any of these items as the value to check against
Q MEMBER(TYPENAME BOX) - MEMBER has an optional element type qualifier
```

For Programmable Macro LAnguage (PML) variables, the qualifier should be assigned to a PML array object and passed to the 'Attribute' method as the second argument:

**To query PPOS 1:**
```
!q=object array()
!q[1] = 1
q var !!ce.attribute('PPOS', !q)
```

**To query list of nominal bores:**
```
!q=object array()
!q[1] = 'BORE'
q var !!ce.attribute('NOMBMM', !q)
```

**To query Equipment members:**
```
!q=object array()
!q[1] = object elementtype('EQUI')
q var !!ce.attribute('MEMBER', !q)
```

---

## Relative Positions, Directions, Orientations

Positions, Orientations, directions can be queried relative to another element using the WRT syntax.

```
Q POS WRT /MYBRAN
Q PPOS(1) WRT /MYBRAN
```

The use of WRT is described more fully in the Expressions.

---

## Pseudo Attributes

### Pseudo attributes relating to the list of attributes

| Attribute Name | Data Type   | Qualifier | Description                                |
|----------------|-------------|-----------|--------------------------------------------|
| ATTLIST        | WORD(300)   |           | List of all visible attributes for element |
| PSATTS         | WORD(500)   |           | List of pseudo attributes                  |
| UDALIS         | WORD(300)   |           | List of UDAs                               |
| UDASET         | WORD(300)   |           | List of UDAs set                           |

### Pseudo attributes relating to the name

| Attribute Name | Data Type   | Qualifier | Description           |
|----------------|-------------|-----------|-----------------------|
| CUTNAM         | STRING(700) | NUMBER    | Full name of element  |

| Attribute Name | Data Type   | Qualifier | Description                                                            |
|----------------|-------------|-----------|------------------------------------------------------------------------|
| CUTNMN         | STRING(700) | NUMBER    | Full name of element (without leading slash) truncated to n characters |
| FLNM           | STRING(700) |           | Full name of the element                                               |
| FLNN           | STRING(700) |           | Full name of the element (without leading slash)                       |
| ISNAMED        | BOOL        |           | True if element is named                                               |
| NAMESQ         | STRING(700) |           | Type. sequence number and name of element                              |
| NAMETY         | STRING(700) |           | Type and name of the element                                           |
| NAMN           | STRING(500) |           | Name of the element (without leading slash)                            |
| NAMTYP         | STRING(700) |           | Type and full name of element                                          |

### Pseudo attributes relating to the type

| Attribute Name | Data Type | Qualifier | Description                                                         |
|----------------|-----------|-----------|---------------------------------------------------------------------|
| ACTTYPE        | WORD      |           | Type of the element, ignoring UDET, truncated to 4 or 6 characters. |
| AHLIS          | WORD(200) |           | List of actual types in owning hierarchy                            |
| OSTYPE         | WORD      |           | Short cut for "Type of owner"                                       |
| TYPE           | WORD      |           | Type of the element, ignoring UDET, truncated to 4 or 6 characters  |

---

## Set Attributes

Information is provided on the standard and special syntax, resetting user defined attributes (UDAs) to default, setting arrays, values of arrays and related pseudo attributes.

### Standard Syntax

Attribute values can be set in two ways:

1. By assigning a value via a Programmable Macro Language (PML) variable, for example:
   ```
   !!CE.XLEN = 99
   ```

**Note:** There must be a space between the '=' and a digit. "!!CE.XLEN =99" would not be valid.

2. Use the attribute name to assign a value to the Current Element (CE), for example:
   ```
   XLEN 99
   ```

The following general rules must be followed:

- The value assigned must be the correct type for the attribute type (see examples below)
- PML variables can not be directly used if using method (2). The PML variable must be expanded using the late evaluation syntax, i.e. 'XLEN !A' is invalid but 'XLEN $!A' is OK. This also applies to any PML variables within expressions.

#### Behavior for each attribute type:

**REAL attribute** - allows an int, real or real expression
```
!A = 1000
!!CE.XLEN= !A
!!CE.XLEN= (99.9 + !A )
XLEN $!A
XLEN (99.9 + $!A )
XLEN (99 + XLEN OF PREV BOX )
```

**INTEGER attribute** - allows an int, a real or real expression. The result will be rounded to the nearest integer.
```
!!CE.AREA = 99.6
Q AREA - will now return 100
```

**TEXT attribute** - allows a text value, a text expression, or UNSET. Assigning UNSET will result in a zero length string.
```
!A = 'Some text '
!!CE.DESC = 'My description'
!!CE.DESC = (!A + 'extra text')
DESC UNSET
```

**LOGICAL attribute** - allows FALSE, TRUE or logical expression.
```
SHOP TRUE
!A = 99
!B = 100
!!CE.SHOP ( !A GT !B)
SHOP ( $!A GT $!B)
```

**REF attribute** - allows a name, refno, ID expression, or UNSET, NULREF keywords. The UNSET and NULREF keywords both result in a null reference (=0/0) being assigned.
```
CREF =123/456
CREF /MYBRAN
CREF UNSET
CREF NULREF
!!CE.CREF (FIRST MEMBER OF /PIPE1 )
```

**Note:** There must be a space between the name and the ')'

**WORD attribute** - If assigning to a PML variable, then allows a text value or text expression.
```
!A = 'FLG'
!!CE.TCON = !A + 'D'
```

If assigning via the attribute name, then it must be a word.
```
TCON FLGD
```

**POSITION attribute** - allows a position or position expression.
```
HPOS N 100 U 100
!!CE.POS = (N 100 from /MYEQUIP )
AT N 100 from /MYEQUIP
```

**Note:** The POS attribute can not be set by name, use AT syntax instead. Do not use brackets if setting by attribute name.

**DIRECTION attribute** - Allows a direction or direction expression
```
HDIR N 45 U
HDIR TOWARDS /MYEQUIP
!!CE.HDIR = (TOWARDS /MYEQUIP )
```

**Note:** Do not use brackets if setting by attribute name.

**ORIENTATION attribute** - Allows an orientation or an orientation expression
```
ORI N IS U
!!CE.ORI = (N IS E WRT /VESS1 )
```

**Note:** Do not use brackets if setting by attribute name.

The value being assigned to an attribute must either be dimensionally equivalent to the attribute, or else a numerical value (which is taken to be in current working units of the dimension). If there is a clash of physical quantity an error will occur. The following will all generate errors.

```
XLEN 5kg
!!CE.XLEN = 5kg
XLEN $!W where !W has been set to 5kg
```

### Set a UDA Back to a Default

A UDA may be set back to it's default by using the DEFAULT keyword.

```
:MYUDA DEFAULT
```

### Set an Array

If assigning via a Programmable Macro Language (PML) variable, an array attribute must be assigned from a PML array object.

```
!!CE.DESP = !MYARRAY
```

If assigning via the attribute name, then a list of values must be given.

```
DESP 1 2 3 4 5
```

### Single Value of an Array

If assigning via a PML variable, an index number may be specified in square brackets.

```
!!CE.DESP[2] = 99
```

If assigning via the attribute name, a single value of an array may be set using the NUMB keyword. The NUMB keyword follows the attribute name, and is followed by the index number.

```
DESP NUMB 2 99
```

This sets the 2nd value of the array to 99.

The NUMB command actually specifies the start point for a list of values.

```
DESP NUM 3 99 100 101
```

This would set the 3rd value to 99, the 4th to 100 and the 5th to 101.

The new values may go off the end of the existing array, but the start point must not be more than one beyond the existing end point.

```
DESP 1 2 3 - set up initial values
DESP NUMB 4 99 - OK, as at end
DESP NUMB 6 100 - Error, as would leave a gap
