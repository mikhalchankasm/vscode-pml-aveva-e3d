Image /page/0/Picture/1 description: The image shows the logo for AVEVA. The logo is purple and consists of the word "AVEVA" in all capital letters. To the right of the second "E" are three horizontal lines stacked on top of each other. To the right of the "A" is the letters "TM" in a smaller font.

The most recent AVEVA Applicationware (AppWare) does not use a prefix. When creating new PML macros, you are responsible for avoiding name-clashes, for example, by using your own prefix.

Here are some guidelines on naming variables:

- Use each variable for one purpose only and give it a meaningful name.
- Limit the use of Global variables.
  - Where possible use PML object methods and form methods instead of PML functions and macros so as to make use of their members and methods which minimizes use of Global variables.
  - Remember that within the methods of PML objects and forms, you generally need only Local variables. Any values which are to be exported should be made available as members or as method values or returned arguments.
  - Only use PML functions (necessarily Global) for tasks which are genuinely globally accessible, as in, independent of a specific object or form, or which need to be shared by several objects or forms.

### Current Global Variables

| Application           | Prefix  | Comments                                              |
|-----------------------|---------|-------------------------------------------------------|
| Area Based ADP        | !!ABA   | Add-in application.                                   |
| Administration        | !!ADM   | Plus !!CDA.                                           |
| Application Switching | !!APP   |                                                       |
| Batch Handling        | !!BAT   |                                                       |
| CADCentre             | !!CADC  |                                                       |
| Draw                  | !!CDR   |                                                       |
| Draw Icon Location    | !!CD2D  | Icon pathnames.                                       |
| Defaults              | !!DFLTS |                                                       |
| General               | !!CDC   | Plus !!CDD, E, F, G, H, I, L, M, N, P, S,<br>U, V, W. |
| Specialized           | !!CE    | Plus !!ERROR, !!FMSYS, !!CMSYS.                       |
| Various Others        |         |                                                       |

## Creating a Variable with a Built-in Type

You can create variables of any of the built-in types (REAL, STRING, BOOLEAN or ARRAY), as in the following example, which creates a REAL variable and sets its value to 99:

!MyNumber = 99

Image /page/1/Picture/1 description: The image shows the word "AVEVA" in purple. To the right of the word is the letters "TM" in a smaller font.

Because the variable is set to a real, PML knows that its type is real. Similarly, you can create a STRING variable and set it like this:

```
!MyString = 'Hello World'
```

The PML Variable !MyString and the constant 'Hello World' are both objects of type STRING.

A STRING is a very simple object and the only data it contains is its text value. In this simple expression you are creating a new object, a variable of STRING type, by making a copy of the original object, the STRING constant 'Hello World'.

## Other examples:

```
!!Answer = 42 $* creates !!Answer as a GLOBAL REAL variable. 
!Name = 'Fred' $* creates !Name as a LOCAL STRING variable. 
!Grid = TRUE $* creates !Grid as a LOCAL BOOLEAN variable.
```

A variable may also be given a type without giving it an initial value, in which case it will have the value UNSET:

```
!!Answer = REAL() 
!Name = STRING() 
!Grid = BOOLEAN() 
!Lengths = ARRAY()
```

For more information about unset variables, refer to [UNSET Values and UNDEFINED Variables](#page-8-0).

```
!MyDistance = 1metre
```

This will store a distance of length of 1000mm. Millimeters are the database storage unit for distance. However, if the current distance units are cm the value will be reported as 100cm, and when they are inch units the value will be reported as 39.37inches.

The units and measure of any variable can be queried using the UNITS() and DIMENSION() methods of the REAL object. They will return a UNIT and a MEASURE object. These are built in objects which have their own useful set of methods, and are used in other methods to convert values to different units, and to set and query current working units.

## Creating Other Types of Variable

You create variables of types that are System-defined or User-defined, using the OBJECT keyword. For example, to create a variable of type FACTORY:

```
!NewPlant = object FACTORY()
```

## Using the Member Values of an Object

The way to set individual members of an object is to use the dot notation as follows:

```
!NewPlant = object FACTORY() 
!NewPlant.Name = ProcessA 
!NewPlant.Workers = 451 
!NewPlant.Output = 2001
```

The dot notation is used in a similar way to access the value of a member of an object:

```
!People = !NewPlant.Workers
```

This sets the variable !People to 451.

Image /page/2/Picture/1 description: The image shows the word "AVEVA" in a stylized font. The letters are purple. The "V" is replaced by three horizontal lines. The letters are followed by the superscript letters "TM".

# PML Functions and Methods

Functions and methods may optionally have arguments that can be used to return values.

Arguments have a data type which is specified in the function or method definition and they are checked when the function or method is called. An argument may be one of the built-in types REAL, STRING or BOOLEAN; an ARRAY; a built-in object or a User-defined object or specified as ANY.

Functions and methods can optionally return values as their results. Functions that do not return values are known as PML Procedures (see [PML Procedures](#page-3-0)).

Here is a definition of a PML function that has two REAL arguments. It also has a REAL return value, as shown by the final 'is REAL':

```
define function !!Area( !Length is REAL, !Width is REAL )is REAL
```

Inside a function, the arguments are referenced just as if they were local PML variables. The RETURN keyword is used to specify the variable that stores the return value:

```
define function !!Area( !Length is REAL, !Width is REAL ) is REAL 
 !Area = !Length * !Width 
 return !Area 
endfunction
```

When a PML function is called, all the PML variables passed as arguments must already exist.

In addition, arguments used for input must have a value, which could be a constant, when the function is called:

```
define function !!LengthOfName(!Name is STRING) is REAL 
 !TidyName = !Name.trim() 
 return !TidyName.Length() 
endfunction
```

The function is called to set the value of a variable '!Length' as follows:

```
!Length = !!LengthOfName( ' FRED ')
```

Here ' FRED ' is a STRING constant passed as an argument. You could rewrite this function so that it returns its results by changing its arguments. The output argument '!Length' will be set to the value required when the function is called:

```
define function !!LengthAndTrim(!Name is STRING, !Length is REAL) 
 !Name = !Name.Trim() 
 !Length = !Name.Length() 
endfunction
```

Arguments used for output must exist prior to the call and one that is also used as an input argument must also have a value:

```
!Name = ' FRED ' 
!Length = REAL()
```

The function is called to set the value of a variable '!Length' as follows:

```
!!LengthAndTrim(' FRED ', !Length)
```

When an argument value is changed within a PML function its value outside the function is also changed.

The following call is incorrect, as the function cannot modify a constant:

```
!!LengthAndTrim(' FRED ' ,4 ) $* WRONG
```

A PML function returning a value may be used wherever an expression or PML variable can be used, for example, this call to the !Area function defined above:

```
!PartLength = 7
```

Image /page/3/Picture/1 description: The image shows the word "AVEVA" in a stylized font. The letters are a dark purple color. To the right of the word is the trademark symbol.

```
!PartWidth = 6 
!SurfaceArea = !!Area(!PartLength, !PartWidth)
```

#### Note:

You cannot switch to a different AVEVA E3D module if a PML function is running. Use EXIT to exit from the function if it has failed to complete.

## Storing and Loading PML Functions

When a PML function is called, it is loaded automatically from its source file in a directory located via the environment variable PMLLIB. The name of the external file must be lowercase and must have the .pmlfnc suffix. The source of a PML function invoked as !!AREA or !!Area or !!area, all correspond to the file named area.pmlfnc.

## Note:

The!! signifies that the function is User-defined and that it is Global - but !! does not form part of the external filename. All User-defined functions are Global and only one may be defined per file.

### Note:

The define function must be the first line in the file and that its name and the file name must correspond.

<span id="page-3-0"></span>

## PML Procedures

A PML procedure is a PML function that does not return a result.

A function is defined as a procedure by omitting the data type at the end of the 'define function' statement:

```
define function !!Area( !Length is REAL, !Width is REAL, 
 !Result is REAL) 
!Result = !Length * !Width 
endfunction
```

Here you are using an output argument !Result to return the result rather than using a function return value.

The arguments to the !!Area procedure can be set as follows, and then the procedure invoked with the call command.

```
!SurfaceArea = REAL() 
!Partlength = 7 
!PartWidth = 6 
call !!Area(!PartLength, !PartWidth, !SurfaceArea)
```

There will be an error if you attempt to assign the result of a PML procedure because there is no return value to assign. So for example you can say:

```
call !!Area(!PartLength, !PartWidth, !SurfaceArea) 
!Answer = !SurfaceArea
```

But you cannot say:

```
!Answer = !!Area 
(!PartLength, !PartWidth, !SurfaceArea) 
                                              $* WRONG
```

The ( ) parentheses after the name of a procedure or function must always be present - even for procedures that do not need arguments:

```
define function !!Initialise() 
 !TotalWeight = 0 
 !!MaxWeight = 0
```