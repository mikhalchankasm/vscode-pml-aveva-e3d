-- Test file for method definitions and calls
-- Use this to test Go to Definition (F12) and Find References (Shift+F12)
define method .methodName1()

    -- Method body
    |Hello world|.output()

endmethod


-- Этот метод должен быть вызван из другого метода
-- @param1 - первый параметр
define method .methodName001(!param1 is string) is string

    -- Method body
    return |Hello world|  

endmethod




!S.
!k.methodName1()



















































!x.methodName1()































!M = 'SOME TEXT'
!M.methodName001()






