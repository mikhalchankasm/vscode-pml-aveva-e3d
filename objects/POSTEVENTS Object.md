# POSTEVENTS Object

You may provide a PostEvents object, which should provide the methods described below.

To use this feature, you must create a global object of this type and call it `!!postEvents`.

The method `!!postEvents.postMark` will be called every time an undoable is created, after the undoable has been added to the undo stack.

This refers to all undoables, whether created by a MARKDB command, an undoable object or within core functionality.

Similarly, the method `postUndo` will be called after an UNDO has occurred, and so on. Each method will be passed a STRING object containing the name of the mark with which the mark, undo, or redo is associated.

## Methods

| Name              | Result    | Purpose                                                                                                                        |
|-------------------|-----------|--------------------------------------------------------------------------------------------------------------------------------|
| postMark(STRING)  | NO RESULT | Called after an undoable has been added to the undo stack. STRING is the description text associated with the undoable object. |
| postUndo(STRING)  | NO RESULT | Called after an undo has occurred. STRING is the description text associated with the undoable object.                         |
| postRedo(STRING)  | NO RESULT | Called after a redo has occurred. STRING is the description text associated with the undoable object.                          |
| postClearMark()   | NO RESULT | Called after a clearMark has occurred.                                                                                         |
| postClearAll()    | NO RESULT | Called after a clearAll has occurred.                                                                                          |

---

# PROJECT Object

## Members

| Name   | Type   | Purpose                                              |
|--------|--------|------------------------------------------------------|
| Name   | STRING | The name of the Project, up to 120 characters.       |
| Evar   | STRING | Project environment variable, for example, 'SAM000'. |
| Type() | REAL   | Returns a REAL which represents the Project type, 0 being Plant and 1 being Marine. |

## Methods

| Name              | Result              | Purpose                                                                |
|-------------------|---------------------|------------------------------------------------------------------------|
| Active()          | REAL                | Number of active Users of the Project.                                 |
| Code()            | STRING              | Project code, three characters, for example, 'SAM'.                    |
| Description()     | STRING              | Project description, up to 120 characters.                             |
| Mbcharset()       | STRING              | Multi-byte character set number.                                       |
| Message()         | STRING              | Project message (information about the project), up to 120 characters. |
| Name()            | STRING              | Project name.                                                          |
| Number()          | STRING              | Project number, up to 17 characters.                                   |
| Isglobal()        | BOOLEAN             | Whether Project is a Global Project.                                   |
| Locations()       | ARRAY OF LOCATION   | Returns array of all Locations in Project.                             |
| CurrentLocation() | LOCATION            | Returns true current location.                                         |
| Sessions()        | ARRAY OF SESSIONS   | Returns array of all Sessions (at the current location).               |
| CurrentSession()  | SESSION             | Returns current Session (at the current location).                     |
| Dblist()          | ARRAY OF DB OBJECTS | List of databases in the project.                                      |
| MDBList()         | ARRAY OF MDBS       | Returns array of all MDBs in Project at current location.              |
| UserList()        | ARRAY OF USERS      | Returns array of all USERs in Project at current location.             |
| Macros()          | ARRAY OF MACROS     | Returns array of all Inter-db macros in MISC db in Project at current location. |
| Messages()        | ARRAY OF STRINGS    | Returns array of all messages in MISC DB at current location.          |

## Commands

```
!ARRAY = PROJECTS
```

Returns an array of all PROJECT objects which have project environment variables set.

```
!PROJECTVAR = CURRENT PROJECT
```

Returns the current project object.
