-- Test file to verify PML extension basic features
-- Use this file to check if the extension works correctly

-- 1. Syntax Highlighting Test
-- All keywords below should be highlighted:
define object TEST
    member .name is STRING
    member .value is REAL

    construct()
        !this.name = 'Test'
        !this.value = 123.45
    endconstruct

    -- 2. IntelliSense Test
    -- Start typing "define method" - you should see autocomplete suggestions
    define method .getValue()
        return !this.value
    endmethod

    -- 3. Go to Definition Test (F12)
    -- Place cursor on "getValue" below and press F12
    -- It should jump to the method definition above
    define method .testNavigation()
        !result = !this.getValue()
        $P Result: $result
    endmethod

    -- 4. Hover Information Test
    -- Hover over "getValue" - you should see documentation

endobject

-- 5. Document Symbols Test
-- Open "Outline" view (Ctrl+Shift+O or Cmd+Shift+O)
-- You should see: TEST object, members (.name, .value), methods

-- 6. Diagnostics Test
-- Uncomment line below - you should see error about unclosed block
-- define method .broken()
--     !x = 10
-- (missing endmethod)

-- 7. Array Commands Test
-- Select lines below and right-click → PML - Array → ReIndex
!items[1] = 'item 1'
!items[2] = 'item 2'
!items[3] = 'item 3'
!items[3] = 'item 4'
!items[3] = 'item 5'

-- Expected result: indices should be renumbered 1, 2, 3, 4, 5

-- Test Results:
-- [ ] Syntax highlighting works
-- [ ] IntelliSense autocomplete works
-- [ ] F12 Go to Definition works
-- [ ] Hover shows documentation
-- [ ] Outline shows symbols
-- [ ] Diagnostics show errors
-- [ ] Array commands work
