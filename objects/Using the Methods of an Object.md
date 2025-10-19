## Methods on User-Defined Object Types

When you define a new object type, you can also define methods which can be used to handle all objects created with the new type. PML method definitions are stored in the same file as the object definition, after the endobject command.

Here is an example of an object which defines three methods to illustrate the main ideas.

### Note:

Within a method, !This represents the object which invoked the method and !This.Answer is the way to refer to member Answer of this object.
