| Name                                      | Result    | Purpose                                                                 |
|-------------------------------------------|-----------|-------------------------------------------------------------------------|
| After(STRING two)                         | STRING    | Return sub-string following leftmost occurrence of sub-string two.     |
| Before(STRING two)                        | STRING    | Return sub-string before leftmost occurrence of sub-string two.         |
| Block()                                   | BLOCK     | Make STRING into a BLOCK for evaluation.                                |
| Boolean()                                 | BOOLEAN   | TRUE if STRING is ‘TRUE’, ‘T’, ‘YES’ or ‘Y’; FALSE if STRING is ‘FALSE’, ‘F’, ‘NO’, or ‘N’. |
| Bore()                                    | BORE      | Convert STRING to a BORE (exact conversion - see also NEARESTBORE).     |
| Bore(FORMAT)                              | BORE      | Convert STRING to a BORE using the settings in the global FORMAT object.|
| DBRef()                                   | DBREF     | Convert STRING to a DBREF.                                              |
| DBRef(FORMAT)                             | DBREF     | Convert STRING to a DBREF using the settings in the global format object.|
| Digits()                                  | REAL      | If String contains decimal digits only, then return the positive value represented, else return value -1.0. This handles the digit characters from any Unicode supported language. |
| Direction()                               | DIRECTION | Convert STRING to a DIRECTION.                                          |
| Direction(FORMAT)                         | DIRECTION | Convert STRING to a DIRECTION using the settings in the Global format object. |
| Empty()                                   | BOOLEAN   | TRUE for empty zero-length string.                                      |
| EQNoCase( STRING )                        | BOOLEAN   | Compare equal ignoring case, with given string.                         |
| isDigits()                                | BOOLEAN   | String is a contiguous string of decimal digits only. This includes the digit characters from any Unicode supported language. |
| isLetters()                               | BOOLEAN   | String is a contiguous string of letters only. This includes the letter characters from any Unicode supported language. |
| isLettersAndDigits()                      | BOOLEAN   | String is a contiguous string of letters and decimal digits only. This includes the letters and digits characters from any Unicode supported language. |
| Length()                                  | REAL      | Number of characters in string.                                         |
| LowCase()                                 | STRING    | Convert string to lower case.                                           |
| LT(STRING)                                | BOOLEAN   | Comparison using ASCII collating sequence.                              |
| Match(STRING two)                         | REAL      | Location of start of sub-string two within first string - zero returned if not found. |
| MatchWild(STRING two)                     | BOOLEAN   | TRUE if strings are the same. STRING two may contain wildcard characters: * for any number of characters, ? for any single character. |
| MatchWild(STRING two, STRING multiple)    | BOOLEAN   | TRUE if strings are the same as above but multiple redefines the wildcard for any number of characters. |
| MatchWild(STRING two, STRING multiple, STRING single) | BOOLEAN | TRUE if strings are the same as above but multiple redefines the wildcard for any number of characters and single also redefines that for a single character. |
| Occurs(STRING)                            | REAL      | Returns the number of occurrences of the given string.                  |
| Orientation()                             | ORIENTATION | Convert STRING to an ORIENTATION.                                     |
| Orientation(FORMAT !!format)              | ORIENTATION | Convert STRING to an ORIENTATION using the settings in the Global '!!format'. |
| Part(REAL nth)                            | STRING    | Extract nth field from string where fields are delimited by space, tab or newline. |
| Part(REAL nth, STRING delim)              | STRING    | Extract nth field from string where fields are delimited by delim.      |
| Position()                                | POSITION  | Convert STRING to a POSITION.                                           |
| Position(FORMAT !!format)                 | POSITION  | Convert STRING to a POSITION using the settings in the Global '!!format' object. |
| REAL()                                    | REAL      | Convert to a number.                                                    |
| Replace(STRING two, STRING three)         | STRING    | Replace all occurrences of sub-string two with sub-string three.        |
| Replace(STRING two, STRING three, REAL nth) | STRING  | Replace all occurrences of sub-string two with sub-string three starting at the nth occurrence (or -nth occurrence from the end). |
| Replace(STRING two, STRING three, REAL nth, REAL count) | STRING | Replace count occurrences of sub-string two with sub-string three starting at the nth occurrence (or -nth occurrence from the end). |
| Split()                                   | ARRAY     | Split string into an ARRAY of STRINGS at space (multiple spaces compressed). |
| Split(STRING elim)                        | ARRAY     | Split string into an ARRAY of STRINGS at delim (multiples of delim not compressed). |
| String(BLOCK)                             | STRING    | Creates a STRING from a BLOCK expression.                               |
| String(BOOLEAN)                           | STRING    | Creates a STRING equal to TRUE or FALSE.                                |
| String(BOOLEAN, FORMAT)                   | STRING    | Creates a STRING from a BOOLEAN, as specified in the FORMAT object.     |
| String(BORE)                              | STRING    | Creates a STRING from a BORE.                                           |
| String(BORE, FORMAT)                      | STRING    | Creates a STRING from a BORE, as specified in the FORMAT object.        |
| String(DB)                                | STRING    | Creates a STRING containing the DB name.                                |
| String(DB, FORMAT)                        | STRING    | Creates a STRING containing the DB name. The FORMAT argument is required for consistency by Forms and Menus. |
| String(DIRECTION)                         | STRING    | Creates a STRING from a DIRECTION.                                      |
| String(DIRECTION, FORMAT)                 | STRING    | Creates a STRING from a Direction, as specified in the FORMAT object.   |
| String(FORMAT)                            | STRING    | Convert STRING to a STRING using the settings in the global FORMAT object. |
| String(MDB)                               | STRING    | Creates a STRING containing the MDB name.                               |
| String(ORIENTATION)                       | STRING    | Creates a STRING from an Orientation.                                   |
| String(ORIENTATION, FORMAT)               | STRING    | Creates a STRING from an Orientation, as specified in the FORMAT object. |
| String(POSITION)                          | STRING    | Creates a STRING from a POSITION.                                       |
| String(POSITION, FORMAT)                  | STRING    | Creates a STRING from a POSITION, as specified in the FORMAT object.    |
| String(PROJECT)                           | STRING    | Creates a STRING containing the PROJECT code.                           |
| String(REAL)                              | STRING    | Creates a STRING from a REAL.                                           |
| String(REAL, FORMAT)                      | STRING    | Creates a STRING from a REAL, as specified in the FORMAT object.        |
| String(REAL, STRING)                      | STRING    | Creates a STRING from a REAL. The STRING argument is present for converting the number of decimal places when given in the obsolete format Dn. |
| String(SESSION)                           | STRING    | Creates a STRING containing the SESSION number.                         |
| String(TEAM)                              | STRING    | Creates a STRING containing the TEAM name.                              |
| String(USER)                              | STRING    | Creates a STRING containing you name.                                   |
| Substring(REAL index, REAL nchars)        | STRING    | Returns a sub-string, nchars in length, starting at index.              |
| Substring(REAL index)                     | STRING    | Returns a sub-string from index to the end of the string.               |
| Trim()                                    | STRING    | Remove initial and trailing spaces.                                     |
| Trim(STRING options, STRING char)         | STRING    | Reduce multiple occurrences of char to a single occurrence throughout the STRING (options = ‘M’). |
| Trim(STRING ‘options’)                    | STRING    | Remove initial spaces (options =‘L’), trailing spaces (options = ‘R’) or both (options =‘LR’). |
| UpCase()                                  | STRING    | Convert STRING to upper case.                                           |
| VLogical()                                | BOOLEAN   | Evaluate STRING as a BOOLEAN.                                           |
| VText()                                   | STRING    | Evaluate STRING as a STRING.                                            |
| VValue()                                  | REAL      | Evaluate STRING as a REAL.                                              |