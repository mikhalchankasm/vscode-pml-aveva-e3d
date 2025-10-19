

## Constructor Methods with Arguments

When an object is created, it is possible to supply arguments that are passed by PML to a constructor method with matching arguments instead of the default constructor method:

```
!Marvin = object LIFE(40) This would invoke a method: define method .Life(!Value IS REAL)
```

## Overloading with ANY

As with PML functions, the type of a method argument may be specified as ANY. If method overloading is being used, PML will invoke the method with a matching set of explicitly-typed arguments in preference to calling a method with arguments of type ANY, irrespective of the order the methods appeared in the object definition file:

```
define method .SetValue( !Argument Is ANY) define method .SetValue( !Argument Is REAL) Then: !SomeObject.SetValue(100) This will invoke the method with the REAL argument, but: !SomeObject.SetValue('Priceless' ) will invoke the method with the ANY argument.
```

## Invoking a Method from Another Method

Within a method !This.Methodname() refers to another method on the same object. So our second LIFE constructor method, the one with an argument, could be defined as:

```
define method .Life(!Value IS REAL) !This.Answer(!Value) endmethod
```

## Developing a PML Object with Methods

Whenever you add a new method to an object, you need to tell PML to re-read the object definition, by giving the command:

```
pml reload object life
```

It is not necessary to use this command if you are simply editing an existing method (although you will have to use it if you edit a form definition file, and change the default constructor method, described in Form Definition File.)

## Unset Variable Representations

Each new data type supports a String() method that returns a string representing the value of the variable. For example:

```
!X = 2.5 $* defines a variable X of type REAL with 2.5 as its
```

```
numeric value. !S = !X.String() $* will be a variable of type STRING, with the value "2.5".
```

UNSET variables of all built-in data types have an unset representation:

```
!X = REAL()! S = !X.String() $* yields the string '(the empty string). !X = BOOLEAN() !S = !X.String() $* yields the string " (the empty string). !X = STRING() !S = !X.String() $* yields the string 'Unset'. !X = ARRAY() !S = !X.String() $* yields the string 'ARRAY'.
```

Other variable types are system-defined variables. Most of these have adopted the unset string ' Unset '. For example:

```
!X = DIRECTION() !S = !X.String() $* yields the string 'Unset'.
```

User-defined data types can also provide a String() method. These also support an UNSET representation, and usually adopt the UNSET representation 'Unset'.

## UNSET Values and UNDEFINED Variables

All data types can have the value UNSET which indicates that a variable does not have a value. A variable created without giving it an initial value in fact has the value UNSET:

!X = REAL()

Variables with an UNSET value can be passed around and assigned, but use of an UNSET value where a valid item of data is required will always result in a PML error.

The presence of an UNSET value may be tested either with functions or methods:

```
Functions Methods if ( Unset(!X) ) then if ( !X.Unset() ) then if ( Set(!X) ) then if ( !X.Set() ) then
```

An UNDEFINED variable is one that does not exist. The existence of a variable may be tested with these functions:

```
if ( Undefined(!!Y) ) then . . . if ( Defined(!!Y) ) then
```