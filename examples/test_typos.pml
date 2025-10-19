-- Test file for typo detection
-- Try these typos and see warnings:

define method .testTypos()

    if (!x gt 0) then
        !result = 1
    endiff  -- Typo: should be 'endif'

    !var = 123

endmethdo  -- Typo: should be 'endmethod'


define method .anotherTest()

    do !item valeus !list  -- Typo: should be 'values'
        !x = !item
    enddo

endmethod


-- Common typos to test:
-- endiff   → endif
-- enddo    → (correct)
-- enddoo   → enddo
-- methdo   → method
-- mehtod   → method
-- endmehtod → endmethod
-- handl    → handle
-- hendle   → handle
-- retrun   → return
-- contineu → continue
-- brake    → break (this is tricky - 'brake' is a word!)
