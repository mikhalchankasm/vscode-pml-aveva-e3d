
## FRAME Gadget

### **Members**

| Name        | Type                    | Purpose                                                                                                                                 |
| ----------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Tag         | STRING Get/Set          | Text to appear as title on the frame.                                                                                                   |
| Val         | REAL Get/Set            | Selected radio button index as integer.                                                                                         |
| RGroupCount | REAL Get only           | Count of radio buttons (RTOGGLES)within the FRAME's radio group.Returns zero if the FRAME is not a radio group. |
| Callback    | STRING Get/Set          | Radio group select callback string.                                                                                                     |
| Expanded    | BOOLEAN Get/Set | FoldUpPanel's expanded status.                                                                                                          |
| Selected    | BOOLEAN Get/Set | Tabbed Page selected status.                                                                                                            |

## **Methods**

| Name                      | Result | Purpose                                                                                                                                                                                                                                                                                                                                   |
| ------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rtoggle( !index is REAL ) | GADGET | Returns the RTOGGLE gadget with index '!index'.                                                                                                                                                                                                                                                                                   |
| Background()              | STRING | Get Background Color Name.Some gadgets do not support this property in all circumstances, for example, gadgets which are showing a pixmap.Gadgets whose color has not been set explicitly, may not have a color with a known colorname. In this case, an error is raised. |

## **Command**

The FRAME command defines a frame gadget.

A frame is a container which owns and manages any gadgets defined within its scope, including other frames.

The frame gadget properties visible and active will automatically apply to all of its children, but will not overwrite

their corresponding property values.

There are five types of FRAME: NORMAL, TABSET, TOOLBAR, PANEL and FOLDUP PANEL.

- A NORMAL frame can contain any type of gadget, including other frames. It also behaves as a radio group, with radio buttons defined by the set of RTOGGLE gadgets that it directly contains. See the entry RTOGGLE Object for more about the RTOGGLE gadget.
- A TABSET frame can contain only tabbed page FRAMEs; you cannot nest them and they are not named.
- A TOOLBAR frame can contain only a subset of gadget types: BUTTON, TOGGLE, OPTION, and TEXT. It must have a name and can appear only on main forms.

```
                                          .---<-------.

                                         /            |

>--FRAME gname -+- TOOLBAR -+- tagtext -+- <toolbar> -* toolbar contents

                |                       ‘—- EXIT -->

                |            .---<--------.

                |           /             |

                +- TABSET -+-- <fgpos> ---|

                |          +-- <fganch> --|

                |          +-- <fgdock> --|

                |          +-- <vshap> ---*

                |          | .---<--------.

                |          |/             |

                |          +-- <tabset> --| tabbed frame contents

                |          +-- NL --------*

                |          ‘-- EXIT -->

                +- PANEL --+--------------.

                |          ‘--INDENT------|

                +- FOLDUPpanel +-<fgcol>--| .---<--------.

                               ‘----------|/             |

                                          +-- tagtext ---|

                                          +-- <fgpos> ---|

                                          +-- <fganch> --|

                                          +-- <fgdock> --|

                                          +-- <vshap> ---*

                                          | .---<--------.

                                          |/             |

                                          +-- formc> ---* form contents

                                          ‘-- EXIT -->
```

Here, the sub-graphs `<toolbar>`, `<tabset>` and `<formc>` define the allowable gadgets and layout commands available within the specific container type.

### **Note:**

The graph `<formc>` defines the normal content of a form, all gadget types (except BAR) are allowed. There are restrictions on frame gadget types as defined below.

#### **Setting Up a TOOLBAR Frame**

The toolbar frame allows you to define formal toolbars that contain all the gadgets in the frame's scope. You can define a toolbar frame only for a main form, and a main form can contain only toolbar frames.

The graph below defines the allowable content of a toolbar frame:

```
>-- toolbar -+-- <fbutn> ----. Button gadget 
           +-- <ftext> ----| text gadget 
           +-- <ftogl> ----| toggle gadget 
           +-- <foptio> ---| option gadget
```

```
+-- <fvar> -----| form variable definition 
+-- <pml> ------| general PML 
+-- <nxasgn> ---| PML expressions 
'-- <varset> ---'----> variable setting VARº
```

#### **Setting Up a TABSET Frame**

A TABSET frame defines a container for a set of tabbed page frames. It has no visible border and no name.

The graph below defines allowable contents of a TABSET frame:

```
>-- tabset >-+-- <fframe> ---. frame gadget 
           +-- <fvar> -----| form variable definition 
           +-- <pml> ------| general PML 
           +-- <nxasgn> ---| PML expressions 
           '-- <varset> ---'----> variable setting VARº
```

##### **Note:**

Frame gadgets defined anywhere within the TABSET frame can only be of type NORMAL, not TOOLBAR or TABSET frames. NORMAL frames defined directly within the TABSET frame, will appear as tabbed pages within it. Setting a tabbed page frame's VISIBLE property selects it and gives it focus, but does not raise HIDDEN or SHOWN events.

##### **Setting up a Panel Frame**

The panel is a rectangular region within a form which can contain the normal form gadgets, but doesn't have to be enclosed in a solid-line box.

### Notes:

- 1. After choosing frame type Panel, the contents is defined in the usual manner.
- 2. Tagtext can be specified, but it is never displayed.
- 3. The panel has no visible enclosing box, unless the INDENT option is specified when it will have a 3D indented appearance.
- 4. Panel supports all the attributes of a Normal Frame including the notion of a radio button group.

##### **Setting up a Fold Up Panel**

This is a rectangular panel with a visible border frame and title bar, which houses a clickable 'expander' icon. Notes:

- 1. After choosing frame type FoldUpPanel, you may specify the background color (`<fgcol>` graph), e.g. BACKGround lightGold, backg 23, backg FORM.
- 2. The contents of the FoldUpPanel, is defined in the usual manner and can contain the usual PML gadgets except another FoldUpPanel.
- 3. Separate events are raised after expanding or collapsing the panel.
- 4. The default state is 'expanded'.
- 5. When the panel expands or collapses, any gadgets which lie below the panel and between (or partially between) the panel's horizontal limits will be moved down or up the form.
- 6. If the form's AutoScroll attribute is selected, then a scroll bar will automatically appear whenever gadgets have been moved off the bottom of the form, so that all of the form is still accessible.
- 7. The FoldUpPanel supports all the attributes of a Normal Frame including the notion of a radio button group.

Refer to [PML Customization](https://docs.aveva.com/bundle/e3d-design/page/1026634.html) for a more detailed explanation of how to use FoldUpPanel frames and avoid

possible problems,

For frames which are FoldUpPanels, 'HIDDEN' and 'SHOWN' events are raised whenever you interactively fold or unfold the panel. These events are only fired if a PML open callback is defined.

This makes sure that the SELECT event, used to signal selection of a radio button within a fold-up panel can still be handled by simple (non-Open) callbacks.

To manage FoldUpPanels which are also radio groups, then you must supply an open callback so that you can differentiate the panel's SELECT, HIDDEN and SHOWN events.

## **Tabbed Page Frame Visible Property and 'Hidden' event**

The VISIBLE property allows a tabbed page to be selected and given focus, for example, '!this.TabbedPage.visible = true'.

When a tabbed page frame's tab is interactively selected, there is now a HIDDEN event raised when the currently shown page is hidden, followed by a SHOWN event when the newly selected page is shown. These events are only raised if a PML open callback has been assigned.

The SELECTED property now allows a tabbed page to be selected and given focus, for example, '!this.TabbedPage.selected = true'.

When a tabbed page frame's tab is interactively selected, there is a HIDDEN event raised when the currently shown page is hidden, followed by a SHOWN event when the newly selected page is shown. These events are only raised if a PML open callback has been assigned.

The VISIBLE property on a tabbed page now has the same behaviour as for other gadgets, and will now make the tabbed page visible and invisible.
