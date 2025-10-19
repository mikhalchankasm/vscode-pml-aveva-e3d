# LOCATION Object

## Members

| Name        | Type    | Purpose                                  |
|-------------|---------|------------------------------------------|
| Name        | STRING  | Location name.                           |
| Description | STRING  | Description, up to 120 characters.       |
| Locid       | STRING  | Location identifier.                     |
| Refno       | STRING  | STRING containing Database reference no. |
| IsCurrent   | BOOLEAN | True for the current Location.           |

## Methods

| Name             | Result            | Purpose                                                                                                                |
|------------------|-------------------|------------------------------------------------------------------------------------------------------------------------|
| LOCATION(DBREF)  | LOCATION          | Returns a LOCATION object, given a DBREF.                                                                             |
| LOCATION(STRING) | LOCATION          | Returns a LOCATION object, given a name or reference number (Global projects only).                                    |
| Dblist()         | ARRAY OF DB       | Array of DB objects for Allocated DBs. This method does not modify the original object.                                |
| Sessions()       | ARRAY OF SESSIONS | Return array of all Sessions extracted from COMMs DB at the Location. This method does not modify the original object. |
| String()         | STRING            | STRING containing Location name. This method does not modify the original object.                                      |

## Usage Examples

You can use the constructors in the following ways:

```
!D = OBJECT LOCATION(!!CE)
!D = OBJECT LOCATION(!!CE.Name)
!D = !!CE.LOCATION()
!D = !!CE.Name.LOCATION()
```

In all cases, `!!CE` is assumed to be a DB database element and `!!CE.Name` is a STRING object containing the element's name.

These methods should assist performance improvements to AppWare by making it easier to get from Database element to Object.

## Note

The Sessions() method provides information required for remote expunging. This method will cause daemon activity for locations other than the current location.

---

# MACRO Object

## Members

| Name     | Type   | Purpose                                        |
|----------|--------|------------------------------------------------|
| Filename | STRING | Inter-DB macro filename (up to 17 characters). |
| From     | DB     | Source DB of inter-DB connection macro.        |
| Number   | REAL   | Inter-DB macro number.                         |
| To       | DB     | Target DB of inter-DB connection macro.        |

## Command

```
!ARRAY = MACROS
```

Returns an array of all the MACRO objects in the project.

---

# MDB Object

## Members

| Name        | Type   | Purpose                                      |
|-------------|--------|----------------------------------------------|
| Name        | STRING | Name of the MDB, up to 32 characters.        |
| Description | STRING | MDB description, up to 120 characters.       |
| Refno       | STRING | String containing Database reference number. |

## Methods

None of these methods modifies the original object.

| Name           | Result          | Purpose                                      |
|----------------|-----------------|----------------------------------------------|
| MDB(DBREF)     | MDB             | Returns an MDB object, given a DBREF.        |
| MDB(STRING)    | MDB             | Returns an MDB object, given a name or reference number. |
| Current()      | ARRAY OF DBS    | Current databases as an array of DB objects. |
| Deferred()     | ARRAY OF DBS    | Deferred databases as an array of DB objects. |
| Mode()         | ARRAY OF STRINGS| Returns 'NR' or 'RW' for each current DB of the MDB. |

## Usage Examples

You can use the constructors in the following ways:

```
!D = OBJECT MDB(!!CE)
!D = OBJECT MDB(!!CE.Name)
!D = !!CE.MDB()
!D = !!CE.Name.MDB()
```

In all cases, `!!CE` is assumed to be a DB database element and `!!CE.Name` is a STRING object containing the element's name.

These methods should assist performance improvements to AppWare by making it easier to get from Database element to Object.

## Command

```
!ARRAY = MDBS
```

Returns an array of MDB objects in the Project.
