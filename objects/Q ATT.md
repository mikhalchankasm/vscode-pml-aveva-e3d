# Q ATT

The existing Q ATT have been extended to allow for querying distributed attributes.

## Syntax

```
Q ATT [AS ANY | <type>]
```

The command displays all the values of the `:PROCESS` type associated with Current Element (CE).

## Example

```
Q ATT AS :PROCESS
```

## Distributed Attributes and Attribute Syntax

Since more than one instance of a distributed element is handled `[n]` is used to qualify which instance you are interested in.

The syntax is used on both queries and manipulations of attributes, as well as in PML1 expressions.

### Syntax

```
:UDANAME\:UDETNAME
```

### Examples

Query the value of the `:local\:process` distributed attribute on Current Element (CE):

```
Q :LOCAL\:PROCESS
```

Output:

```
:local\process true
```

Set the value of distributed attribute `:local\:process` to false:

```
:LOCAL\:PROCESS false
```

Query all LNLIST elements where distributed attribute `:local\:process` equals true:

```
Q ALL LNLIST WITH (:LOCAL\PROCESS EQ true)
```

Query the value of the second instance of distributed attribute `:local\:process`:

```
Q :LOCAL\:PROCESS[2]
```

Output:

```
:local\process[2] true
```

Set the value of the second instance of distributed attribute `:local\:process` to false:

```
:LOCAL\:PROCESS[2] false
```

Query all LNLIST elements where second instance of distributed attribute `:local\:process` equals true:

```
Q ALL LNLIST WITH (:LOCAL\PROCESS[2] EQ true)
```

## PML2 Support

There is full PML2 support for distributed attributes. Constructs such as `!!ce.:local\:process = false` works as could be expected. Also more complex things involving both arrays and multiple instances of distributed attributes work with the syntax that would be expected.

### Example

Set the third array element in the second instance of distributed attribute `:myArray\:MyList` to 12.345:

```
!!ce.:myArray[3]\:myList[2] = 12.345
```

## Pseudo Attributes Associated with Distributed Attributes

There are a few number of pseudo attributes available to all elements that may have distributed attributes associated with them.

### DLIST - Eligible Distributed Attributes Members

The attribute returns a list of all eligible distributed attribute types that may be associated with Current Element (CE). The list does not consider any constraints defined in the schema.

Example:

```
Q DLIST
```

Output:

```
DLIST :PROCESS :PRESSURE
```

### XRLSTT - List Distributed Attributes Member Types Associated

This attribute returns a list of all distributed attribute types associated with current element.

Example:

```
Q XRLSTT
```

Output:

```
XRLSTT :PROCESS :PRESSURE
```

### XRLIST - List Distributed Attributes Member Associated

The attribute returns a list of all distributed attribute members (elements) associated with current element. The attribute may take an optional qualifier on typename.

Example:

```
Q XRLIST
```

Output:

```
XRLIST
  1 :PROCESS   1 of XPIFLD  2 of XPIFLD  1 of /THEPROCWLD
  2 :PRESSURE  1 of XPIFLD  2 of XPIFLD  1 of /THEPROCWLD
```

Query with typename qualifier:

```
Q XRLIST (TYPENAME :PROCESS)
```

Output:

```
1 :PROCESS  1 of XPIFLD  2 of XPIFLD  1 of /THEPROCWLD
```

### XRQCNT - Count of Distributed Attributes Member Associated

The attribute returns the number of distributed attribute members (elements) associated with current element. The attribute may take an optional qualifier on typename.

Example:

```
Q XRQCNT
XRQCNT 2

Q XRQCNT (TYPENAME :PROCESS)
XRQCNT 1
```

### XRQELE - Return a Single Distributed Attribute Member

The attribute returns a selected distributed attributes member of distributed attribute members (elements) associated with current element. The attribute may take an optional qualifier of typename and relative position.

Example:

```
Q XRQELE
XRQELE 1 :PROCESS  1 of XPIFLD  2 of XPIFLD  1 of /THEPROCWLD

Q XRQELE (1)
XRQELE 1 :PRESSURE  1 of XPIFLD  2 of XPIFLD  1 of /THEPROCWLD
```

### ATTDST - List of Attributes to Show

The attribute is available on the distributed attribute member and returns a list of attributes that should be shown by default as attributes. The attribute fulfils the same purpose as ATTLIS for normal attributes.

Example:

```
Q ATTDST
```

Output:

```
ATTDST :TEMP :VISCOCITY
```

### DFHOME - The Evaluated Default Home

The attribute is available on any element. In addition to be used for distributed attributes, it may be used in a generic way.

#### When used specifically for distributed attributes evaluation

It takes the typename of a bindable noun/udet as qualifier. It evaluates the actual home element using current element as when evaluating the test expressions and returns a nulref or a ref to an XPIWLD element.

**Note:** The evaluation finds the associated Distributed Attribute Default Home (DSXHOM) from the typename qualifier, after that processing is the same as for the generic case.

#### Using it for generic "find a default home" purposes

The DSXHOM reference passed as a qualifier is used to evaluate the expressions defined in the DSXTST/DSXDST of that DSXHOM. It returns a nulref of the ref of the ID value held in the DHTEXT attribute of the resulting DSXDST. The Current Element (CE) is passed to the expression for evaluation.

Examples:

Distributed attributes - get the location to store distributed attributes of type process for CE:

```
Q DFHOME (TYPENAME :PROCESS)
DFHOME /THEPROCESSWORLD
```

Generic example - get the reference that results of evaluation the DSXHOM `/MyHomeSelector` for `/TESTTHIS`:

```
Q DFHOME (/MyHomeSelector) OF /TESTTHIS
DFHOME /STOREITHERE
```

## DATAL

As a complement to normal Data Listing (DATAL) processing of distributed attributes, there is a specialized support that generates datals with the distributed attributes syntax.

### Syntax

```
OUTPUT INCLUDE Distributed/ATTRIBUTES ... <SELELE> and other options
```

For example: getting everything under the ZONE `/MyZone` including any distributed attributes would be done by executing the following output command:

```
OUTPUT INCLUDE DistributedA /MyZone
```

Part of the output would resemble the following, with the distributed attributes statements included:

```
NEW EQUI DATT
NEW :Process
:Local\:Process false
END
```

## Element Selection, Claim, Flush

The element selection syntax is extended so that the distributed attribute group, in previous examples the `:Process` is addressable using the AS keyword. Allows you to extract operations such as claim, flush and Status Control operations on the distributed attribute granularity level.

### Status Control Examples

Assign `/MyStatus` to distributed attribute group `:Process` of `/MyEquip`:

```
STM ASS /MyStatus to /MyEquip as :Process
```

Query the list of assigned statuses of the distributed attribute group `:Process` of `/MyEquip`:

```
Q STVLST OF /MyEquip AS :Process
```

Output:

```
StvLst\:Process /MyStatus
```

Query the status value for `/MyStatus` of the distributed attribute group `:Process` of `/MyEquip`:

```
Q STVVAL(/MyStatus) OF /MyEquip AS :Process
StvLst\:Process /NotStarted
```
