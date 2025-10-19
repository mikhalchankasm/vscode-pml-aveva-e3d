# Software Customization

Details the methods that are available for the customization of AVEVA products (using PML and NET customization). It also includes Query which is essentially a programming toolkit which allows the user to create their own macros.

The Software Customization User Guide describes the methods that are available for the customization of AVEVA products.

The methods available for the customization of AVEVA products are:

- Programmable Macro Language (PML)
- Common Application Framework (CAF)
- CAF Addins
- .NET Interfaces
- Data Model (using UDETs and UDAs)
- PML.NET

The diagram displays the available customization methods and interfacing options.

## Customize the Graphical User Interface

Most AVEVA products make use of a Graphical User Interface (GUI) to drive the software. The interfaces provided with the AVEVA software are designed to apply to a wide range of situations and business needs. As experience is gained of the AVEVA products, it may be necessary to design an interface that is related specific requirements.

Before customizing a GUI, it is essential to have a good working knowledge of the command syntax for the AVEVA product. The commands are described in detail in the product reference manuals.

## Serious Warning about Software Customization

The ability to customize individual applications to suit specific needs provides great flexibility in the ways that the system can be used.

It also introduces the risk that modified macros may not be compatible with future versions of the software, since they are no longer controlled by AVEVA.

Customized applications may diverge from future standard versions of AVEVA software and may not take advantage of product enhancements incorporated into the standard product.

To minimize this risk, it is most important that the in-house customization policies constrain any changes made to the applications so that they retain maximum compatibility with the standard product at all times.

AVEVA can only give full technical support for products over which it has control. AVEVA cannot guarantee to solve problems caused by software that has been customized.

## Programmable Macro Language

The Programmable Macro Language (PML) is a domain specific language developed by AVEVA to customize AVEVA products.

PML1 uses command syntax graphs and expressions. For example:

```
MOVE BY NORTH 100
```

```
VAR !length ( 2 + 3 )
```

PML2 includes object orientated functionality for windows and menus. For example:

```
!s = object selection()
!s.GetCurrentSelection()
```

PML addin files used can be used to add applications to AVEVA products.

Detailed information about PML is available, refer to PML Customization for further information.

## Common Application Framework

The Common Application Framework (CAF) provides the .NET programmer with access to various services which support both application development and customization. The available services are:

- ServiceManager
- AddinManager
- SettingsManager
- CommandBarManager/RibbonBar
- CommandManager
- ResourceManager
- WindowManager

CAF uses a declarative XML definition of menus, toolbars and ribbon tabs and can be used as a menu/toolbar design tool.

Each CAF based application consists of an XML customization file which lists UIC files that define the tools attached to commands.

### XML Customization File

The example displays an XML customization file named in the format `<module>Customization.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<UICustomizationSet xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <UICustomizationFiles>
        <CustomizationFile Name="Module" Path="module.uic" />
    </UICustomizationFiles>
</UICustomizationSet>
```

### UIC File

The example displays a UIC file named in the format `module.uic`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<UserInterfaceCustomization xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns="www.aveva.com">
    <VersionNumber>1.0</Version>
    <Tools>
        <PopupControlContainerTool Name="Aveva.Pdms.HistoryBackContainer">
            <Command>
```

### CAF .NET Commands

NET commands can be used in a CAF. For example:

```csharp
public class MyCommand : Aveva.ApplicationFramework.Presentation.Command {
    public override void Execute() {
        Console.WriteLine("Do something");
    }
    public override System.Collections.ArrayList List {
        get { return new System.Collections.ArrayList(); }
    }
}
```

### CAF PML Commands

PML commands can be used in a CAF. For example:

```
setup command !!MyCommand
exit

define method .commanda()
    !this.key = 'Aveva.Pdms.Pml.commanda'
    !this.Execute = 'Execute'
    !this.list = 'List'
endmethod

define method .Execute(!args is ARRAY)
    $P Execute commanda
endmethod

define method .List(!args is ARRAY)
    !a = object array()
    !a[0] = 'a'
    !args[0] = !a
endmethod
```

### Execute the CAF Command

Attach the command object to the AVEVA module using the Command window.

Execute the command. For example:

```
define method Execute(!args is ARRAY)
    q var !this.checked()
endmethod
```

The button is displayed on the ribbon.

Detailed information about CAF is available, refer to Common Application Framework Interfaces and Menu and Command Bar Customization for further information.

## Common Application Framework Addins

CAF addins provide the .NET programmer with access to .NET interfaces or other systems using the IAddin interface. Addins are loaded when the AVEVA module is launched. CAF addins can be used to subscribe to application events and load commands to the GUI.

Each CAF addin is listed as an XML addin configuration file which lists all of the addins that are loaded when the module is launched.

### XML Addin Configuration File

The example displays an xml addin configuration file named in the format `<module>Addins.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<ArrayOfString xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <string>MyAddin</string>
</ArrayOfString>
```

The XML addin configuration file works with the `CAF_ADDINS_PATH` and `CAF_UIC_PATH` environment variables:

- `CAF_ADDINS_PATH` - Indicates the location of the addins.
- `CAF_UIC_PATH` - Indicates the location of files where the GUI is defined.

The example displays the processes used to create and implement a CAF addin.

### IAddin Interface File

The example displays an IAddin interface file:

```csharp
public class MyAddin : Aveva.ApplicationFramework.IAddin {
    public MyAddin() { }
    
    void Aveva.ApplicationFramework.IAddin.Start(ServiceManager serviceManager) {
        CommandManager cm = serviceManager.GetService(typeof(CommandManager));
        cm.Commands.Add(new MyCommand());
    }
}
```

Detailed information about CAF addins is available, refer to How to Write a Common Application Framework Addin and Environment Variables for .NET Customization for further information.
