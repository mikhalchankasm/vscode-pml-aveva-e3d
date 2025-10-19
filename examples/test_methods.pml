-- Test file for method definitions and calls
-- Use this to test Go to Definition (F12) and Find References (Shift+F12)

define method .calculateArea(!width is REAL, !height is REAL) is REAL
    -- Calculate area of rectangle
    !area = !width * !height
    return !area
endmethod

define method .calculateVolume(!width is REAL, !height is REAL, !depth is REAL) is REAL
    -- Calculate volume of box
    !area = .calculateArea(!width, !height)  -- Call to .calculateArea
    !volume = !area * !depth
    return !volume
endmethod

define method .testCalculations()
    -- Test the calculation methods
    !myArea = .calculateArea(10.0, 5.0)  -- F12 should jump to line 4
    !myVolume = .calculateVolume(10.0, 5.0, 3.0)  -- F12 should jump to line 10

    -- Test from another file
    !result = .processData('test')  -- Should jump to test_objects.pml
endmethod
