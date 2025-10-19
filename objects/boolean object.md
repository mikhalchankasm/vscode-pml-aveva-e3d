Boolean object

Methods
None of these methods modifies the original object.

| Name                                         | Result  | Purpose                                                                                                                                                |
| -------------------------------------------- | ------- |:------------------------------------------------------------------------------------------------------------------------------------------------------ |
| BOOLEAN(REAL value)                          | BOOLEAN | Constructor that creates a boolean object, set to a non-zero value if boolean is TRUE. 0 if boolean is FALSE.                                          |
| BOOLEAN(STRING value)                        | BOOLEAN | Constructor that creates a boolean Object set to: TRUE if boolean is T, TR, TRU, TRUE, Y, YE, YES; FALSE if boolean is F, FA, FAL, FALS, FALSE, N, NO. |
| BOOLEAN(STRING value, FORMAT BOOLEAN format) | BOOLEAN | As above. FORMAT argument required for consistency by Forms and Menus.                                                                                 |
| AND()                                        | BOOLEAN | TRUE if both values are TRUE.                                                                                                                          |
| NOT()                                        | BOOLEAN | TRUE if FALSE. FALSE if TRUE.                                                                                                                          |
| OR(BOOLEAN value)                            | BOOLEAN | TRUE if either value is TRUE.                                                                                                                          |
| Real()                                       | REAL    | 1 if boolean is TRUE. 0 if boolean is FALSE.                                                                                                           |
| String()                                     | STRING  | TRUE if boolean is TRUE. FALSE if boolean is FALSE.                                                                                                    |