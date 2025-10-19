# FILE Object

## Methods

| Name                                | Result          | Purpose                                                                                                                                  |
| :---------------------------------- | :-------------- | :--------------------------------------------------------------------------------------------------------------------------------------- |
| File(STRING)                        | FILE            | Creates a FILE object on a file whose name is given in STRING.                                                                         |
| AccessMode()                        | STRING          | Returns access mode for the file {'CLOSED', 'READ', 'WRITE', 'OVERWRITE', 'APPEND'}.                                                     |
| Close()                             | NO RESULT       | Closes file if it is open.                                                                                                             |
| Copy(STRING)                        | FILE            | Copies the file whose pathname is given in STRING. Returns FILE object for copied file.                                                   |
| Copy(FILE)                          | FILE            | Copies the file represented by the FILE object. Returns FILE object for copied file.                                                      |
| DeleteFile()                        | NO RESULT       | Delete the file represented by the FILE object if it exists.                                                                           |
| Directory()                         | FILE            | Returns a FILE object corresponding to owning directory.                                                                               |
| DTM()                               | DATETIME        | Returns a DATETIME object holding the date and time that this file was last modified.                                                  |
| Entry()                             | STRING          | Returns file name as string.                                                                                                           |
| Exists()                            | BOOLEAN         | Returns BOOLEAN indicating whether file exists or not.                                                                                   |
| Files()                             | ARRAY OF FILES  | Returns an ARRAY of FILE objects corresponding to files owned by this directory.                                                        |
| FullName()                          | STRING          | Returns the name including path for this FILE object as a STRING.                                                                        |
| IsOpen()                            | BOOLEAN         | Returns BOOLEAN indicating whether file is open or not.                                                                                  |
| LineNumber()                        | REAL            | Returns line number of line about to be written.                                                                                        |
| Move(STRING)                        | FILE            | Moves this file to location given in STRING.                                                                                           |
| Move(FILE)                          | FILE            | Moves this file to location represented by FILE object.                                                                                  |
| Name()                              | STRING          | Returns name of this FILE object as STRING.                                                                                              |
| Open(STRING)                        | NO RESULT       | Opens this file in the mode given by STRING. {'READ', 'WRITE', 'OVERWRITE', 'APPEND'}                                                     |
| Owner()                             | STRING          | Returns the ID of this FILE's owner as a STRING.                                                                                        |
| Path()                              | ARRAY OF FILES  | Returns an ARRAY of FILEs corresponding to the owning directories of this FILE object.                                                    |
| PathName()                          | STRING          | Returns owning path as a STRING.                                                                                                        |
| ReadFile()                          | ARRAY OF STRING | Open, read contents and close file. Data returned as an ARRAY of STRINGs corresponding to the lines in the file.                         |
| ReadFile(REAL)                      | ARRAY OF STRING | As above, but making sure that file is no longer than number of lines given in REAL.                                                    |
| ReadRecord()                        | STRING          | Reads a line from an open file and returns it in a STRING. Returns an UNSET STRING if end of file is detected.                         |
| Set()                               | BOOLEAN         | Returns a BOOLEAN indicating whether this FILE object has a name set or not.                                                             |
| Size()                              | REAL            | Returns size of file in bytes.                                                                                                          |
| SubDirs()                           | ARRAY OF FILE   | Returns an ARRAY of FILE objects corresponding to directories owned by this directory.                                                     |
| Type()                              | STRING          | Returns a STRING indicating whether this object represents a 'FILE' or a 'DIRECTORY'.                                                      |
| WriteFile(STRING, ARRAY OF STRING)   | NO RESULT       | Opens file in mode given in string {'WRITE', 'OVERWRITE', 'APPEND'}, writes STRINGs in ARRAY and closes file.                              |
| WriteRecord(STRING)                  | NO RESULT       | Writes STRING to this FILE which must already be open.                                                                                  |

