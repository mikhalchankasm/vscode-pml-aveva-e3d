-- Test file for object definitions
-- Use this to test cross-file navigation

define object MyDataProcessor

    member .data is STRING
    member .count is REAL

    -- Constructor
    define method .setup()
        -- Initialize object
        this.data = |empty|
        this.count = 0
    endmethod

    -- Process data method (called from test_methods.pml)
    define method .processData(!input is STRING) is STRING
        this.data = !input.upcase()
        this.count = this.count + 1
        return this.data
    endmethod

    -- Get statistics
    define method .getStats() is STRING
        !result = |Processed: | & this.count.string() & | items|
        return !result
    endmethod

endobject
