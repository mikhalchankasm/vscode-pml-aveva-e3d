# Button Gadgets - Examples and Reference

## Quick Reference

### Button Types
- **Normal Button** - Standard button with text or pixmap
- **Toggle Button** - Button with pressed/unpressed states (val = TRUE/FALSE)
- **Link Label** - Text-only button with no border, underlines on hover

### Control Attributes
- **OK** - Confirms and closes form
- **CANCEL** - Dismisses form without saving
- **APPLY** - Applies changes without closing
- **RESET** - Resets form to initial values
- **HELP** - Opens help documentation

### Common Patterns
```pml
-- Basic button
button .btnName |Button Text| width 10

-- Button with callback
button .btnCalculate |Calculate| callback |!this.onCalculate()| width 10

-- Button opening child form
button .btnMore |More...| form !!ChildForm width 10

-- Control buttons
button .btnOk |OK| callback |!this.onOk()| OK width 8
button .btnCancel |Cancel| CANCEL width 8
button .btnApply |Apply| callback |!this.onApply()| APPLY width 8

-- Toggle button
button .btnToggle toggle |Toggle Text| callback |!this.onToggle()| width 10

-- Toggle button with pixmap
button .btnTogglePix toggle callback |!this.onToggle()| pixmap width 72 height 23

-- Link label (no border, underlines on hover)
button .btnLink linklabel |Link Text| callback |!this.onLink()| width 10

-- Positioned button
button .btnNext |Next| at xmax+2 ymin width 10

-- Button with background color
button .btnYellow |Yellow| background 4 width 10
```

---

## Complete Example Form

```pml
setup form !!exampleButtons
    !this.formTitle = |Button Examples|

    -- Normal buttons
    button .butt1 |Normal| width 8
    button .butt2 linklabel |Link Label| at xmax+2.7 width 6
    button .butt3 |Yellow| at xmax+2.5 background 4 width 8
    button .butt4 |Deactive| at xmin.butt1 ymax width 8

    -- Button opening child form
    button .butt5 |Child Form| form !!childForm width 9

    -- Toggle button with pixmap
    button .butt6 toggle background 4 callback |!this.check()| pixmap width 72 height 23

exit

------------------------------------------------------------------------
--
-- Method:      exampleButtons
--
-- Description: Constructor method for the exampleButtons form
--
-- Method Type: Function/Procedure
-- Arguments:
--   [#] [R/RW] [Data Type] [Description]
-- Return:
--   [Data Type] [Description]
--
------------------------------------------------------------------------
define method .exampleButtons()

    -- Deactivate button in constructor
    !this.butt4.active = FALSE

    -- Add pixmaps to toggle button
    !off = !!pml.getPathName(|officon.png|)
    !on  = !!pml.getPathName(|onicon.png|)
    !this.butt6.addPixmap(!off, !on)

endmethod

------------------------------------------------------------------------
--
-- Method:      check
--
-- Description: Return the toggle button value
--
-- Method Type: Function/Procedure
-- Arguments:
--   [#] [R/RW] [Data Type] [Description]
-- Return:
--   [Data Type] [Description]
--
------------------------------------------------------------------------
define method .check()

    -- Return the toggle button value to the command line
    !check = !this.butt6.val
    $p Toggle button value: $!check

endmethod
```

---

## Button Gadget Members

| Name       | Type               | Purpose                                      |
|------------|--------------------|----------------------------------------------|
| Background | REAL (Set/Get)     | Set or Get Background Color Number           |
| Background | STRING (Set Only)  | Set Background Color Name                    |
| Val        | BOOLEAN            | TRUE when pressed, FALSE when not pressed    |

## Button Gadget Methods

| Method                                | Result    | Purpose                                           |
|---------------------------------------|-----------|---------------------------------------------------|
| AddPixmap(STRING file1, file2, file3) | NO RESULT | Add pixmaps (unselected, selected, inactive)      |
| AddPixmap(STRING file1, file2)        | NO RESULT | Add pixmaps (file3 optional)                      |
| AddPixmap(STRING file1)               | NO RESULT | Add single pixmap                                 |
| FullName()                            | STRING    | Get full gadget name (e.g. !!Form.gadget)         |
| Name()                                | STRING    | Get gadget name (e.g. 'gadget')                   |
| Owner()                               | FORM      | Get owning form                                   |
| SetPopup(MENU menu)                   | NO RESULT | Link popup menu to gadget                         |
| RemovePopup(MENU menu)                | NO RESULT | Remove popup menu from gadget                     |
| GetPickedPopup()                      | MENU      | Get picked popup menu name                        |
| Shown()                               | BOOLEAN   | Get shown status                                  |
| SetFocus()                            | NO RESULT | Move keyboard focus to gadget                     |
| Refresh()                             | NO RESULT | Refresh gadget display                            |
| Background()                          | STRING    | Get Background Color Name                         |
| SetToolTip(STRING)                    | NO RESULT | Set tooltip text                                  |
| Type()                                | STRING    | Get gadget type as STRING                         |

---

## Toggle Button Details

Toggle buttons show visually differentiated pressed and unpressed states.

**For buttons with pixmaps:**
- The Unselected and Selected pixmaps swap when pressed
- Alternates between two images in pressed/unpressed states

**For textual buttons:**
- Highlight when pressed (e.g. blue to orange on toolbars)
- Return to original color when unpressed

**Toggle button value:**
```pml
!isPressed = !this.btnToggle.val  -- TRUE when pressed, FALSE when not
```

**Syntax:**
```pml
button .B1 TOGGLE pixmap /Unselected.png /Selected.png width 16 height 16
```

---

## Link Label Details

Link labels provide a purely textual button with no enclosing box.

**Characteristics:**
- Tag text shown in different color
- Underlines when mouse hovers over it
- Pressing raises SELECT event and runs callback
- Causes validation of modified text fields

**Restrictions:**
- Cannot have pixmaps
- Do not support background color changes
- Do not support pressed/not pressed value
- Can have popup menus (not recommended)
- Do not have Control Types (OK, CANCEL, etc.)

**Syntax:**
```pml
button .btnLink linklabel |Link Text| callback |!this.onLink()| width 10
```

---

## Best Practices

1. **Always use meaningful button names** - Use descriptive names like .btnCalculate, not .btn1
2. **Specify width** - Use WIDTH keyword to ensure consistent sizing
3. **Add tooltips for icon buttons** - Help users understand button purpose
4. **Use control attributes** - OK, CANCEL, APPLY for standard dialog buttons
5. **Toggle buttons need callbacks** - Handle state changes in callback methods
6. **Deactivate in constructor** - Set `.active = FALSE` for conditional buttons
7. **Load pixmaps in constructor** - Use `.addPixmap()` method in form constructor

---

## FAQ

**Q: How do I change button text dynamically?**
A: You cannot change button text after creation. Use multiple buttons and show/hide them instead.

**Q: How do I disable a button?**
A: Set `.active = FALSE` in your form method:
```pml
!this.btnCalculate.active = FALSE
```

**Q: How do I check if toggle button is pressed?**
A: Read the `.val` member:
```pml
if !this.btnToggle.val then
    -- Button is pressed
endif
```

**Q: Can I use button callbacks without validation?**
A: No, buttons always trigger validation. Use SELECT events if you need to bypass validation.

**Q: How do I position buttons relative to each other?**
A: Use gadget anchoring:
```pml
button .btn1 |First| width 10
button .btn2 |Second| at xmax+2 ymin width 10  -- 2 units right of btn1
button .btn3 |Third| at xmin.btn1 ymax width 10 -- Below btn1
```

**Q: What are the available background colors?**
A: Common colors: 0=white, 1=black, 2=red, 3=green, 4=yellow, 5=blue, 6=magenta, 7=cyan

---

*This example was generated by PML Extension for VS Code*
*Use the snippets: button, buttoncall, buttonform, buttonok, buttoncancel, etc.*
