

# BUTTON Gadget

## **Members**

| Name       | Type               | Purpose                                                   |
|------------|--------------------|-----------------------------------------------------------|
| Background | REAL<br>Set/Get    | Set or Get Background Color<br>Number.                    |
| Background | STRING<br>Set Only | Set Background Color Name.                                |
| Val        | BOOLEAN            | TRUE when the button is pressed.<br>FALSE when it is not. |

#### **Methods**

| Name                                                    | Result    | Purpose                                                                         |
|---------------------------------------------------------|-----------|---------------------------------------------------------------------------------|
| AddPixmap(STRING file1,<br>STRING file2, STRING file3 ) | NO RESULT | Adds pixmaps to be used for the<br>unselected, selected and inactive<br>states. |
| AddPixmap(STRING file1,<br>STRING file2)                | NO RESULT | The last two are optional.                                                      |
| AddPixmap(STRING file )                                 | NO RESULT |                                                                                 |
| FullName()                                              | STRING    | Get the full gadget name, for<br>example, !!Form.gadget.                        |
| Name()                                                  | STRING    | Get the gadget's name, for<br>example, 'gadget'.                                |
| Owner()                                                 | FORM      | Get owning form.                                                                |
| SetPopup(MENU menu)                                     | NO RESULT | Links the given menu with the<br>gadget as a popup.                             |
| RemovePopup(MENU menu)                                  | NO RESULT | Removes the given popup menu<br>from the gadget.                                |
| GetPickedPopup()                                        | MENU      | Returns the name of the menu<br>picked from a popup.                            |
| Shown()                                                 | BOOLEAN   | Get shown status.                                                               |
| SetFocus()                                              | NO RESULT | Move keyboard focus to this<br>gadget.                                          |


| Refresh()          | NO RESULT | Refresh display of gadget.                                                                                                                                                                                                                                           |
|--------------------|-----------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Background()       | STRING    | Get Background Color Name.                                                                                                                                                                                                                                           |
|                    |           | Some gadgets do not support this<br>property in all circumstances, for<br>example, gadgets which are<br>showing a pixmap.<br>Gadgets whose color has not been<br>set explicitly may not have a color<br>with a known colorname. In this<br>case, an error is raised. |
| SetToolTip(STRING) | NO RESULT | Sets the text of the Tooltip.                                                                                                                                                                                                                                        |
| Type()             | STRING    | Get the gadget-type as a STRING.                                                                                                                                                                                                                                     |

### **Command**

The BUTTON command defines a button, and specifies its position, tag, or pixmap, callback text, and control attribute.

You can define the button to be either PML-controlled, or core-code-controlled, using the gadget qualifier attribute control type, with values "PML" or "CORE".

The files defining any pixmaps should be specified in the form's default constructor method using the gadget's AddPixmap() method. Refer to [Icons from Resource Files](https://docs.aveva.com/bundle/e3d-design/page/1027011.html) for further information..

A button type 'Linklabel' provides a purely textual button presentation, often used to indicate a link to some application item, for example, a hyperlink to a file, a link to an associated form. An example of the Linklabel gadget is shown on the example form in Fold up Gadget Link Example Form with Fold-up panels, NumericInput and Linklabel gadgets.

The tag text is shown in a different color to all other gadget's tag text. The link label gadget highlights by underlining when the mouse cursor passes over it. Pressing it causes a SELECT event to be raised and runs any associated call back.

### **Button Gadget**

The Button has the subtypes Normal, Toggle, and Linklabel.

Linklabels are Buttons and so they do cause validation of any modified text fields of the form whenever they are pressed.

### Linklabels:

- cannot have pixmaps assigned to them.
- do not support change of background color.
- do not support 'pressed' and 'not pressed' value.
- are not enclosed in a box.
- can have pop-up menus (though this is not recommended).
- do not have Control Types, for example, 'OK', 'CANCEL'.