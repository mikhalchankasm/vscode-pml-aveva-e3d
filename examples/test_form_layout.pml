-- ============================================
-- Тестирование setup form / layout form и frame
-- ============================================

-- Вариант 1: setup form
setup form !!exporttorvm dialog resize
    -- Define form
    !lrtb     = layout anchor all at x0 y0 wid 100 HEI 100
    !lrt      = layout anchor all at x0 y0 wid 100 HEI 100
    !pixmap16 = pixmap size 16 16

    !this.FormTitle    = |Export to RVM|
    !this.FormRevision = |1.0|
    !this.Initcall     = |.initForm|
    !this.Call         = |.callForm|

    -- Menu
    !menu = menu
    !this.pop.add(!menu)
    !menu.add(|Remove selection|, |.removeSelection|)
    !menu.add(|Remove all|, |.removeAll|)

    -- Output file
    text.txtFile |Путь к выгружаемому файлу:| at x0 y0 wid 80 HEI 3
    button.browseFile |Выбор| at x80 y0 wid 20 HEI 3 call |.browseFile|

    -- Frame 1
    frame.frIncludeList |Список для экспорта| anchor all at x0 ymax +0.5 wid 80 HEI 15
        button.addCE |Добавить текущий элемент| at x0 y0 wid 40 HEI 3 call |.addCurrentElement|
        button.addMEMV |Добавить МЕМВ текущего элемента| at x40 y0 wid 40 HEI 3 call |.addMEMV|
        button.addDrawlist |Добавить Drawlist| at x0 y3 wid 40 HEI 3 call |.addDrawlist|
        container.gridIncludeList at x0 y6 wid 80 HEI 9

    exit

    -- Frame 2
    frame.frExcludeList |Список для исключения| $!lbr at x0 ymax +0.5 wid 80 HEI 12
        button.exc1CE |Исключить текущий элемент| at x0 y0 wid 40 HEI 3 call |.excludeCurrentElement|
        button.exc1MEMV |Исключить МЕМВ| at x40 y0 wid 40 HEI 3 call |.excludeMEMV|
        container.gridExcludeList at x0 y3 wid 80 HEI 9

    exit

    -- Frame 3
    frame.frSettings |Настройки экспорта| $!lbr at x0 ymax +0.5 wid 80
        checkbox.chkIncludeHidden |Включить скрытые элементы| at x0 y0 wid 40 HEI 3
        checkbox.chkExportGeometry |Экспортировать геометрию| at x40 y0 wid 40 HEI 3
        checkbox.chkExportAttributes |Экспортировать атрибуты| at x0 y3 wid 40 HEI 3

    exit
exit

-- Вариант 2: layout form (равнозначно setup form)
layout form !!anotherForm dialog
    !this.FormTitle = |Another Form|

    frame.frMain |Main Frame| at x0 y0 wid 100 HEI 50
        text.txtInfo |Information| at x0 y0 wid 100 HEI 10
        button.btnOK |OK| at x0 y10 wid 50 HEI 5 call |.onOK|
        button.btnCancel |Cancel| at x50 y10 wid 50 HEI 5 call |.onCancel|

    exit
exit

-- Вариант 3: Вложенные frame
setup form !!nestedForm dialog
    frame.frOuter |Outer Frame| at x0 y0 wid 100 HEI 80
        text.txtOuter |Outer text| at x0 y0 wid 100 HEI 10

        frame.frInner |Inner Frame| at x0 y10 wid 100 HEI 60
            text.txtInner |Inner text| at x0 y0 wid 100 HEI 10
            button.btnInner |Inner button| at x0 y10 wid 100 HEI 10 call |.innerAction|

        exit

        button.btnOuter |Outer button| at x0 y70 wid 100 HEI 10 call |.outerAction|
    exit
exit
