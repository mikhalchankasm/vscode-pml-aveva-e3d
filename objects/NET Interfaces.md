# .NET Interfaces

.NET API's provide access to various aspects of the product including the GUI, database and geometry. Customization using .NET technology provides a mechanism whereby a .NET assembly (DLL) can be dynamically loaded into a module at runtime.

## Application Framework Interfaces

The Application Framework Interfaces are documented at https://help.aveva.com/API/CAF/index.html.

## Database Interfaces

The database related interfaces are provided by the interface assemblies:

- `Aveva.Core.Database.dll` & `Aveva.Core.Database.Filters.dll`

The interface has many geometry related classes. For example:

- Data model definition
- Basic database element access, query and modification
- Filters and iterators
- Events and pseudo attribute plugins

Detailed information about database interfaces is available, refer to Database Interface for further information.

## Geometry Interfaces

The geometry related interfaces are provided by the interface assembly:

- `Aveva.Core.Geometry.dll`

The interface has many geometry related classes. For example, position, orientation, direction, arc, line and plane.

## Maths Interfaces

The maths related interfaces are provided by the interface assembly:

- `Aveva.Core.Maths.Geometry.dll`

The interface has many two dimensional and three dimensional low level geometry related classes.

## Shared Interfaces

Some general shared interfaces are provided in the interface assembly:

- `Aveva.Core.Shared.dll`

The interface provides current element, selection changed events and datal listing facilities. Visual Studio can be used to find the classes and methods.

## Utilities Interfaces

Utility interfaces are provided in the interface assembly:

- `Aveva.Core.Utilities.dll`

The interface provides messaging, string utilities, tracing, undo and units. It also provides access to the command line but this is not supported.

## Graphics Interfaces

Interfaces to access the drawlist and colours are provided in the interface assembly:

- `Aveva.Core3D.Graphics.dll`

## AVEVA NET Interfaces

Interfaces to access AVEVA NET documents, workflows and items are provided in the interface assembly:

- `AVEVA.NET.CAF.PMLNetSupport.dll`

## Data Model Definition Classes

Data model definition classes allow the metadata to be accessed from User Defined Element Types (UDET) and User Defined Attributes (UDA).

### User Defined Element Types (UDET)

UDETs can be used to extend the existing types and redefine the allowed owners and members.

### User Defined Attributes (UDA)

UDAs can be used to add attributes to existing types and UDETs and to define pseudo attribute plug-ins.

UDAs are created in LEXICON. Refer to the LEXICON documentation for further information.

Code can be plugged in to calculate the value of pseudo attributes. The code must be registered in the AVEVA module by passing in a C# delegate.

The example displays get UDA code:

```csharp
DbAttribute uda = DbAttribute.GetDbAttribute(":VOLUME");
```

The example displays defined UDA delegate code:

```csharp
static private double VolumeCalculation(DbElement ele, DbAttribute att, DbQualifier qualifier) {
}
```

The example displays add UDA delegate code:

```csharp
DbPseudoAttribute.GetDoubleDelegate dele = new DbPseudoAttribute.GetDoubleDelegate(VolumeCalculation);
DbPseudoAttribute.AddGetDoubleAttribute(uda, NOUN.EQUI, dele);
```

The example displays get UDA on an equipment code:

```csharp
DbElement equi = DbElement.GetElement("/VESS1")
double vol = equi.GetDouble(uda);
```

Alternatively, the command line can be used:

```
/VESS1 Q :VOLUME
```

### Events

The example displays database change event code:

```csharp
DatabaseService.Changes += new DbChangesEventHandler(DatabaseService_Changes);

static void DatabaseService_Changes(object sender, DbChangesEventArgs e) {
    DbElement[] creations = e.ChangeList.GetCreations();
    DbElement[] deletions = e.ChangeList.GetDeletions();
    DbElement[] memberChanges = e.ChangeList.GetMemberChanges();
    DbElement[] modifications = e.ChangeList.GetModified();
}
```

Detailed information about PML.NET is available, refer to PML.NET for further information.

## PML.NET

PML.NET is used to instantiate and invoke methods on .NET objects from PML proxy objects. PML proxy class definitions are created from .NET class definitions at run time. These proxy classes present the same methods as the .NET class which are described using custom attributes. Proxy methods are passed arguments of known types which are marshalled to the corresponding method on to the .NET instance. The PML proxy objects behave just like any other PML object.

The PML.NET functionality includes:

- .NET reflection to create PML class definition
- Creation of a proxy PML instance which behaves just like any other PML object
- Mixing of PML and .NET assemblies and access to .NET objects from PML
- Extensible Hybrid GUI with .NET controls
- PML customization using events

The example displays PMLNetCallable class code:

```csharp
MessageBox.Show("Message");
```

```csharp
using System;
using Aveva.PDMS.PMLNet;

namespace Aveva.PDMS.PMLNetTest {
    [PMLNetCallable()]
    public class PMLNetObject {
        [PMLNetCallable()]
        public PMLNetObject() {
        }
        
        [PMLNetCallable()]
        public void Test() {
        }
    }
}
```

The .NET class is instantiated using the Command Window.

Resulting in the display of the following window:

### PMLUserControl

The example displays PMLNetCallable user control code which is used to prepend the class definition:

```csharp
[PMLNetCallable()]
public class GridControl : System.Windows.Forms.UserControl {
}
```

### PML Form

The example displays PMLNetCallable form control code which is used to create the window:

```
import 'GridControl'
handle any
endhandle

setup form !!MyForm
    resize
    using namespace 'Aveva.Pdms.Presentation'
    member .grid is NetGridControl
    path down
    container .gridFrame
    PmlNetControl 'grid' dock fill width 30 height 20
exit
```

The example displays PMLNetCallable form control code which is used to display the window:

```
show !!MyForm
```

### Call PML from Managed Code

```csharp
PMLNetAny any = PMLNetAny.createInstance("PMLObject", args, 0);
```

```
define object PMLObject
    member .name is STRING
endobject

define method .PMLObject()
    !this.name = 'PMLObject'
endmethod

define method .PMLMethod()
    …
endmethod
```

```csharp
any.invokeMethod("PMLMethod", args, 0, ref result);
```

```
define method .PMLMethod()
    …
endmethod
```

Detailed information about PMLNet is available, refer to Data Model Definition Classes for further information.
