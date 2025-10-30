# Frame Gadgets - Examples and Reference

## Quick Reference

### Frame Types
- **Normal Frame** - Standard container with border and title
- **TabSet Frame** - Container for tabbed pages
- **Toolbar Frame** - Horizontal toolbar (main forms only)
- **Panel Frame** - Container without visible border
- **Fold-up Panel** - Expandable/collapsible container with expander icon

### Common Attributes
- **Tag** - Frame title text
- **Val** - Selected radio button index (for radio groups)
- **RGroupCount** - Number of radio buttons in frame
- **Callback** - Radio group selection callback
- **Expanded** - Fold-up panel expand status (BOOLEAN)
- **Selected** - Tabbed page selection status (BOOLEAN)

### Common Patterns
```pml
-- Normal frame
frame .frName |Frame Title| at x0 y0 width 100 height 30
    -- Frame contents
exit

-- TabSet with tabbed pages
frame tabset at x0 y0 width 100 height 50
    frame .frTab1 |Tab 1| at x0 y0 width 100 height 50
        -- Tab 1 contents
    exit
    frame .frTab2 |Tab 2| at x0 y0 width 100 height 50
        -- Tab 2 contents
    exit
exit

-- Toolbar (main forms only)
frame .frToolbar toolbar |Toolbar|
    button .btnTool1 |Tool 1| callback |!this.onTool1()| width 10
    button .btnTool2 |Tool 2| callback |!this.onTool2()| width 10
exit

-- Panel (no border)
frame panel at x0 y0 width 100 height 30
    -- Panel contents
exit

-- Panel with indent (3D appearance)
frame panel indent at x0 y0 width 100 height 30
    -- Panel contents
exit

-- Fold-up panel
frame .frFoldUp folduppanel |Fold-up Title| at x0 y0 width 100 height 30
    -- Expandable contents
exit

-- Fold-up with background
frame .frFoldUp folduppanel background lightGold |Title| at x0 y0 width 100 height 30
    -- Contents
exit

-- Radio group frame
frame .frRadio |Radio Group| at x0 y0 width 100 height 30 callback |!this.onRadioSelect()|
    rtoggle .opt1 |Option 1| at x0 y0
    rtoggle .opt2 |Option 2| at x0 ymax+2
    rtoggle .opt3 |Option 3| at x0 ymax+2
exit
```

---

## Complete Example Form

```pml
setup form !!exampleFrames dialog resize
    !this.formTitle = |Frame Examples|

    -- Normal frame
    frame .frFirst |First Frame| at x0 y0 width 100 height 30
        text .txt1 |Text 1| at x0 y0 width 50 height 10
        button .btn1 |Button 1| at x50 y0 width 50 height 10 callback |!this.action1()|
    exit

    -- TabSet with multiple tabs
    frame tabset at x0 y35 width 100 height 50
        frame .frTabA |Tab A| at x0 y0 width 100 height 50
            text .txtA |Text in Tab A| at x0 y0 width 100 height 10
        exit

        frame .frTabB |Tab B| at x0 y0 width 100 height 50
            text .txtB |Text in Tab B| at x0 y0 width 100 height 10
        exit

        frame .frTabC |Tab C| at x0 y0 width 100 height 50
            text .txtC |Text in Tab C| at x0 y0 width 100 height 10
        exit
    exit

    -- Fold-up panel
    frame .frFoldUp folduppanel background lightGold |Fold-up Panel| at x0 y90 width 100 height 30
        text .txtFoldUp |Expandable content| at x0 y0 width 100 height 10
        button .btnFoldUp |Action| at x0 ymax+2 width 50 height 10
    exit

exit

------------------------------------------------------------------------
--
-- Method:      exampleFrames
--
-- Description: Constructor method for the exampleFrames form
--
-- Method Type: Function/Procedure
-- Arguments:
--   [#] [R/RW] [Data Type] [Description]
-- Return:
--   [Data Type] [Description]
--
------------------------------------------------------------------------
define method .exampleFrames()

    -- Initialize fold-up panel as expanded
    !this.frFoldUp.expanded = TRUE

    -- Select first tab by default
    !this.frTabA.selected = TRUE

endmethod

------------------------------------------------------------------------
--
-- Method:      action1
--
-- Description: Handle button click in first frame
--
-- Method Type: Function/Procedure
-- Arguments:
--   [#] [R/RW] [Data Type] [Description]
-- Return:
--   [Data Type] [Description]
--
------------------------------------------------------------------------
define method .action1()

    $p Button 1 clicked!

endmethod
```

---

## Frame Gadget Members

| Name        | Type                | Purpose                                              |
|-------------|---------------------|------------------------------------------------------|
| Tag         | STRING (Set/Get)    | Text to appear as title on the frame                 |
| Val         | REAL (Set/Get)      | Selected radio button index as integer               |
| RGroupCount | REAL (Get only)     | Count of radio buttons (RTOGGLES) in frame           |
| Callback    | STRING (Set/Get)    | Radio group select callback string                   |
| Expanded    | BOOLEAN (Set/Get)   | Fold-up panel's expanded status                      |
| Selected    | BOOLEAN (Set/Get)   | Tabbed page selected status                          |

## Frame Gadget Methods

| Method                         | Result | Purpose                                           |
|--------------------------------|--------|---------------------------------------------------|
| Rtoggle(!index is REAL)        | GADGET | Returns the RTOGGLE gadget with index '!index'    |
| Background()                   | STRING | Get Background Color Name                         |

---

## Frame Types Details

### Normal Frame
A normal frame is a container with a visible border and title that can contain any type of gadget, including other frames.

**Characteristics:**
- Can contain any gadget types
- Supports nesting (frames inside frames)
- Can act as radio button group with RTOGGLE gadgets
- Visible border with title

**Syntax:**
```pml
frame .frName |Frame Title| at x0 y0 width 100 height 30
    -- Any gadget types allowed
exit
```

**Radio Group Example:**
```pml
frame .frRadio |Select Option| at x0 y0 width 100 height 40 callback |!this.onSelect()|
    rtoggle .opt1 |Option 1| at x0 y0
    rtoggle .opt2 |Option 2| at x0 ymax+2
    rtoggle .opt3 |Option 3| at x0 ymax+2
exit

-- In method:
!selectedIndex = !this.frRadio.val  -- Returns 1, 2, or 3
```

---

### TabSet Frame
A TabSet frame is a container for tabbed pages. It has no visible border and no name.

**Characteristics:**
- Contains only tabbed page frames (normal frames)
- No visible border, no name
- Cannot be nested
- Tabs appear at top

**Syntax:**
```pml
frame tabset at x0 y0 width 100 height 50
    frame .frTab1 |Tab 1 Title| at x0 y0 width 100 height 50
        -- Tab 1 contents
    exit

    frame .frTab2 |Tab 2 Title| at x0 y0 width 100 height 50
        -- Tab 2 contents
    exit
exit
```

**Selecting Tabs Programmatically:**
```pml
-- Using SELECTED property (recommended)
!this.frTab2.selected = TRUE  -- Selects Tab 2

-- Using VISIBLE property (legacy)
!this.frTab2.visible = TRUE   -- Also selects Tab 2
```

**Tab Selection Events:**
When a tab is interactively selected, HIDDEN event is raised for the previously shown tab, followed by a SHOWN event for the newly selected tab (only if open callback is defined).

---

### Toolbar Frame
A toolbar frame is a horizontal container for toolbar buttons. Must be on main forms.

**Characteristics:**
- Can contain only: BUTTON, TOGGLE, OPTION, TEXT gadgets
- Must be named
- Can appear only on main forms
- Typically horizontal layout

**Syntax:**
```pml
frame .frToolbar toolbar |Toolbar Title|
    button .btnNew |New| callback |!this.onNew()| width 10
    button .btnOpen |Open| callback |!this.onOpen()| width 10
    button .btnSave |Save| callback |!this.onSave()| width 10
exit
```

**Restrictions:**
- Cannot contain other frames
- Cannot contain all gadget types (only button, toggle, option, text)
- Only for main forms (not dialog forms)

---

### Panel Frame
A panel is a rectangular region without a visible enclosing box (unless INDENT is used).

**Characteristics:**
- No visible border by default
- Supports all normal frame attributes
- Can act as radio button group
- Optional 3D indented appearance

**Syntax (No Border):**
```pml
frame panel at x0 y0 width 100 height 30
    -- Contents
exit
```

**Syntax (With Indent):**
```pml
frame panel indent at x0 y0 width 100 height 30
    -- Contents with 3D indented appearance
exit
```

**Notes:**
- Tag text can be specified but is never displayed
- Supports all attributes of normal frame
- Useful for grouping without visual separation

---

### Fold-up Panel
A fold-up panel is an expandable/collapsible container with a title bar and expander icon.

**Characteristics:**
- Visible border and title bar
- Clickable expander icon (triangle)
- Can expand/collapse
- Raises HIDDEN/SHOWN events when toggled
- Cannot contain another fold-up panel
- Automatically moves gadgets below when expanding/collapsing

**Syntax:**
```pml
frame .frFoldUp folduppanel |Title| at x0 y0 width 100 height 30
    -- Expandable contents
exit
```

**With Background Color:**
```pml
frame .frFoldUp folduppanel background lightGold |Title| at x0 y0 width 100 height 30
    -- Contents
exit
```

**Programmatic Control:**
```pml
-- Expand panel
!this.frFoldUp.expanded = TRUE

-- Collapse panel
!this.frFoldUp.expanded = FALSE

-- Check if expanded
if !this.frFoldUp.expanded then
    $p Panel is expanded
endif
```

**Events:**
- HIDDEN event - raised when panel collapses
- SHOWN event - raised when panel expands
- Only fired if PML open callback is defined

**AutoScroll Behavior:**
If form's AutoScroll attribute is enabled, a scroll bar appears when gadgets are moved off the bottom due to panel expansion.

---

## Nested Frames Example

Frames can be nested to create complex layouts:

```pml
setup form !!nestedForm dialog
    frame .frOuter |Outer Frame| at x0 y0 width 100 height 60
        text .txtOuter |Outer Text| at x0 y0 width 100 height 10

        frame .frInner1 |Inner Frame 1| at x0 y10 width 100 height 20
            text .txtInner1 |Inner Text 1| at x0 y0 width 100 height 10
        exit

        frame .frInner2 |Inner Frame 2| at x0 y30 width 100 height 20
            text .txtInner2 |Inner Text 2| at x0 y0 width 100 height 10
        exit
    exit
exit
```

---

## Best Practices

1. **Frame Naming** - Use descriptive names with `fr` prefix: `.frMain`, `.frDetails`
2. **TabSet Pages** - Always name tabbed pages for programmatic access
3. **Radio Groups** - Always provide callback for frame-based radio button groups
4. **Fold-up Panels** - Use open callbacks to handle HIDDEN/SHOWN events
5. **Nested Frames** - Don't over-nest - keep hierarchy simple
6. **Toolbar Frames** - Only use on main forms, not dialogs
7. **Panel Frames** - Use INDENT option for subtle visual separation
8. **Frame Sizing** - Ensure frame is large enough for all contents

---

## FAQ

**Q: How do I programmatically select a tab?**
A: Use `.selected = TRUE` property:
```pml
!this.frTab2.selected = TRUE
```

**Q: How do I know which radio button is selected in a frame?**
A: Read the frame's `.val` member:
```pml
!selectedIndex = !this.frRadio.val  -- Returns 1, 2, 3, etc.
!selectedButton = !this.frRadio.rtoggle(!selectedIndex)
```

**Q: Can I nest fold-up panels?**
A: No, fold-up panels cannot contain other fold-up panels.

**Q: How do I hide a tabbed page?**
A: Use `.visible = FALSE`:
```pml
!this.frTab2.visible = FALSE  -- Hides tab
```

**Q: What's the difference between panel and panel indent?**
A: Panel has no visible border, panel indent has a subtle 3D indented appearance.

**Q: Can toolbar frames be nested?**
A: No, toolbar frames cannot contain other frames and must be top-level on main forms.

**Q: How do I detect when fold-up panel is expanded/collapsed?**
A: Define open callback and handle HIDDEN/SHOWN events:
```pml
define method .frFoldUp.hidden() open
    $p Panel collapsed
endmethod

define method .frFoldUp.shown() open
    $p Panel expanded
endmethod
```

**Q: How do I change frame title dynamically?**
A: Set the `.tag` member:
```pml
!this.frName.tag = |New Title|
```

---

*This example was generated by PML Extension for VS Code*
*Use the snippets: frame, frametabset, framefoldup, framepanel, frameradio, etc.*
