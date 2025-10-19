# Cleanup and the CLEANUp Command

The command `CLEANUp` cleans up unwanted references in the database. It is possible to remove null references and unresolved/invalid references.

## Logical Attributes for Reference Validation

The logical attributes `NULLREf`, `INVREF` and `UNRESOlved` is used to sort out whether a reference attribute points to something valid or not. The syntax is the same for all three:

### NULLREF

```
Q NULLRE (ATTNAME att)
```

Answers the question: is the attribute `att` null (=0/0)?

### UNRESOLVED

```
Q UNRESO (ATTNAME att)
```

Is the attribute `att` pointing to an element whose existence we cannot find and verify? It could be that the database is missing or that the reference is truly invalid.

### INVREF

```
Q INVREF (ATTNAME att)
```

Is the attribute pointing to an element that is non-existent? This differs from unresolved in that the database that should accommodate the missing element is present in the active mdb.

## Syntax

```
CLEANU/P NULL/REF | INVALID | UNRES/OLVED attribute [ON noun] [FOR ele] [SETNULL | DELETE]
```

## Examples

Delete all EQUI with STLREF equal null (=0/0):

```
CLEANU NULL STLREF ON EQUI DELETE
```

Set all unresolved CATREF in the `/PIPES` hierarchy to null (=0/0):

```
CLEANU UNRES CATREF FOR /PIPES SETNULL
```

Set all unresolved CATREF in the hierarchy under CE to null:

```
CLEANU INVALID CATREF
```

---

## Copying Data between Projects

The Copying Data between Projects facility is not available in AVEVA Plant.

---

## Data Model

Data Model Reference contains details of all the elements which can be created in their respective databases, their position in the database hierarchy and their attributes.

### Assumptions

The Data Model Reference Manual is written for experienced users of AVEVA Plant who need to use commands; for example, to write batch macros or to customise the Graphical User Interface (GUI). If the GUI is going to be customized, you will need to refer to Customizing a Graphical User Interface and Summary of Objects, Members and Methods for information about Programmable Macro Language (PML), the AVEVA programming language.

**Note:** For a comprehensive list of attributes and pseudo-attributes, refer to Object Type Details.

### Analysis Database

The Data Model Reference manual contains details of all the elements which can be created in the Analysis database, their position in the database hierarchy and their attributes.

### Analysis Database Elements

All data in the Analysis database is stored in elements in a strict hierarchy. Every element has a type and each type determines the attributes available on the element. Refer to Database Navigation and Query Syntax for further information on database concepts.
