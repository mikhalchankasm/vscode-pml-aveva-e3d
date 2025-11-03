![](_page_0_Picture_1.jpeg)

```
pixmap /filename width 256 height 200
```

The pixmap may be changed at any time by assigning a new value to the .val member:

```
!!MyForm.picture.val = /newfilename
```

You can add a tooltip to a pixmap paragraph.

## Textual Paragraph Gadgets

The background color may optionally be set using the BACKGROUND keyword and a color specification.

# Button Gadgets

When you press a button gadget (control button) it will usually display a child form or invoke a call-back typically a PML Form method.

Buttons have a tag-name or pixmap which is shown within the button rectangle. The tag, pixmap, call-back, and child form are all optional.

For further information about pixmaps, refer to [Gadgets that Support Pixmaps](#page--1-0).

#### For example:

```
button .SubForm 'More . . .' FORM !!ChildForm 
button .SubForm pixmap /filename FORM !!ChildForm 
button .Calculate 'Calculate' CALLBACK 
'!this.CallbackFunction()'
```

You can specify the width of the independently of any tag text string it contains using the WIDTH syntax. You can also define its height with the HEIGHT syntax, allowing you to define textual BUTTONs taller than a single character in height.

For example:

```
Button .btn1 |reject selection| at ... width 10 height 1.5
```

### Note:

The BUTTON's tag is always center-aligned within the define area.

### Buttons of Type Toggle

Buttons can optionally be used in toggle mode, where they show visually differentiated pressed and unpressed states, similar to TOGGLE gadgets.

#### Buttons with Pixmaps

For these buttons, the Unselected and Selected pixmaps swap whenever the button is pressed, so alternating between the two images in the pressed and un-pressed states.

### Textual Buttons

Toggle buttons will highlight when pressed. For example on toolbars they will turn from blue to orange when pressed, and go back to blue again when un-pressed.

The syntax to select the new mode is toggle**,** which can be anywhere after the button name and before the

![](_page_1_Picture_1.jpeg)

button control type or associated form, for example:

Button .B1 TOGGLE pixmap /Unselected.png /Selected.png / Inactive.png width 16 height 16 tooltip...

The button's value-member !button.val is a BOOLEAN and reflects the button's state, having the value TRUE when the button is pressed, and FALSE when it is not.

## Buttons of type LINKLABEL

The Linklabel, provides a purely textual button presentation, as in, it has no enclosing box. It is often used to indicate a link to some application item, for example, a hyperlink to a file, a link to an associated form. They do cause validation of any modified text fields of the form whenever they are pressed.

The tag text is shown in a different color to all other gadget's tag text. The link label gadget highlights by underlining when the mouse cursor passes over it. Pressing it causes a SELECT event to be raised and runs any associated call back.

Linklabels have the following restrictions:

- They don't support change of background color.
- They don't support 'pressed' and 'not pressed' value.
- They can have popup menus, though this is not recommended.
- They don't have Control Types, for example, OK, CANCEL, and so on.

The sub-type of any Button gadget can be queried using the it's Subtype method.

### Form Control Attributes

A button may optionally have a form control attribute, such as OK, which takes effect *after* the callback command is invoked.

It is convenient, but not essential, to give a button the same PML name and displayed tag name as its control attribute.

If no form control attribute is specified, the effect of the button depends entirely on the callback or the showing of a child form.

You can only have one of each type of control attribute on any form, apart form APPLY which may be used on several buttons.

![](_page_2_Picture_1.jpeg)

| Control Attribute | Purpose                                                                                                                                                                                                                                                                                                                                                                             |
|-------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| OK                | Allows you to approve the current gadget settings and<br>action the form. The form nest's OKCALL<br>callbacks are<br>run (see Form OK and CANCEL Callbacks) and the nest<br>is hidden. Any callback on the OK<br>button is ignored.                                                                                                                                                 |
| APPLY             | Similar to OK<br>in that the gadget settings are approved<br>and the form is actioned but not removed from the<br>screen. There may in fact be several APPLY<br>buttons for<br>different sections of form (ideally each section within<br>its own Frame). A form with one or more APPLY<br>buttons should also be given a DISMISS<br>button for<br>removing it from the screen.     |
| CANCEL            | Allows you to decide not to proceed with the form.<br>The form nest's CANCELCALL<br>callbacks are run and the<br>nest is hidden. All gadget values are reset to their<br>initial settings or to the values established at the last<br>APPLY.                                                                                                                                        |
| RESET             | Returns the values of all gadgets on the form to the<br>values they had when the form was displayed. If you<br>have since pressed an APPLY<br>button, the form gadgets<br>are reset to the values they had when the APPLY<br>button was last pressed. The callback is then invoked<br>in which your PML code should make sure that<br>anything that needs undoing is indeed undone. |
| HELP              | Invokes online help.                                                                                                                                                                                                                                                                                                                                                                |

The effect of **OK** and **CANCEL** on gadgets is more extensive if a form family is involved, as described in [Free Forms](#page--1-2)  [and Form Families](#page--1-2).

#### Examples:

```
button .Ok AT . . . 'OK' CALLBACK '!!MyOkFunction()' OK 
button .Apply 'Apply' CALLBACK '!!MyApplyFunction()' APPLY 
button .Cancel 'Cancel' CALLBACK '!!MyCancelFunction()' CANCEL 
button .reset AT . . . 'Reset' RESET 
button .help AT . . . 'Help' HELP
```

#### Defining a Dismiss Button

To define a **dismiss** button, use a command like this:

```
button .Dismiss 'Dismiss' CANCEL
```

Note that this button deliberately does *not* have a callback. When this button is pressed, the form nest is removed from the screen and its CANCELCALL callbacks executed.

---

Button Gadget
The Button has the subtypes Normal, Toggle, and Linklabel

Linklabels are Buttons and so they do cause validation of any modified text fields of the form whenever they are
pressed.
Linklabels:
• cannot have pixmaps assigned to them.
• do not support change of background color.
• do not support 'pressed' and 'not pressed' value.
• are not enclosed in a box.
• can have pop-up menus (though this is not recommended).
• do not have Control Types, for example, 'OK', 'CANCEL'.
The subtype of a Button gadget can be queried using the Button's subtype method

```
--------<-------.
/ |
>-BUTTON gname -+- LINKLabel -+-- tagtext -------|
| +-- <fgpos> -------|
| +-- CALLback text -|
| +-- TOOLTIP text --|
| +-- <fganch> ------|
| +-- <fgdock> ------|
| +-- CORE ---------* Core managed gadget
| | .------<-----.
| |/ |
| +- FORM fname -|
| +- <vshap> ----*
| |
| +- TOOLTIP text -.
| '----------------'-->
|
| .--------<----------.
+-- TOGGLE -./ |
'-----------+- tagtext -----------|
+- <fgpos> -----------|
+- CALLback text -----|
+- TOOLTIP text ------|
+- <fganch> ----------|
+- <fgdock> ----------|
+- CORE --------------| Core managed gadget
+- BACKGround <colno>-|
+- PIXMAP <vshap> ----*
| .------<-----.
|/ |
+- FORM fname -|
+- <vshap> ----*
|
+- OK -----.
+- APPLY --|
+- CANCEL -|
+- RESET --|
+- HELP ---|
'----------+- TOOLTIP text -.
'----------------'-->
```