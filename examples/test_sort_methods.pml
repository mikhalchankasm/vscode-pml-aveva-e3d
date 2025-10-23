-- Test file for Sort Methods command

-- Method 3: zebra should be last after sorting
define method .zebra()
    !msg = |This is zebra method|
    $P $!msg
endmethod

-- Method 1: apple should be first
define method .apple(!param is STRING)
    !result = !param.upcase()
    return !result
endmethod

------------------------------------------------------------------------
-- Method 2: banana - with multiline comment
-- Description: This method does something
-- Parameters:
--   !count - number of items
------------------------------------------------------------------------
define method .banana(!count is REAL)
    do !i from 1 to !count
        $P Banana $!i
    enddo
endmethod

-- Single line comment before delta
define method .delta()
    return TRUE
endmethod

define method .charlie(!arr is ARRAY)
    !size = !arr.size()
    return !size
endmethod
