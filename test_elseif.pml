-- ============================================
-- Тестирование elseif и сложных if-конструкций
-- ============================================

define method .testElseIf()
    !depth = 5
    !pDepth = 3
    
    if (!depth eq !pDepth and !pDepth neq -99) then
        var !dprt compose space $!tab |END|
        writefile $!fUnit |$!dprt[1]|
        
    elseif (!depth lt !pDepth) then
        
        do !indxA from !pDepth to !depth by -1
            var !dprt compose space $!indxA |END|
            writefile $!fUnit |$!dprt[1]|
        enddo
        
    elseif (!depth gt !pDepth) then
        
        do !indxA from !depth to !pDepth by -1
            var !dprt compose space $!indxA |END|
            writefile $!fUnit |$!dprt[1]|
        enddo
        
    else
        
        |No action needed|.output()
        
    endif
endmethod

define method .complexIfExample()
    !value = 42
    !type = |number|
    
    if (!value gt 0) then
        if (!type.eq(|number|)) then
            |Positive number|.output()
        elseif (!type.eq(|string|)) then
            |Positive string|.output()
        else
            |Positive other|.output()
        endif
    elseif (!value lt 0) then
        |Negative value|.output()
    elseif (!value eq 0) then
        |Zero value|.output()
    else
        |Unknown value|.output()
    endif
endmethod

define method .nestedIfExample()
    !level1 = TRUE
    !level2 = FALSE
    !level3 = TRUE
    
    if (!level1) then
        |Level 1 true|.output()
        
        if (!level2) then
            |Level 2 true|.output()
            
            if (!level3) then
                |Level 3 true|.output()
            elseif (!level3) then
                |Level 3 false|.output()
            endif
            
        elseif (!level2) then
            |Level 2 false|.output()
        endif
        
    elseif (!level1) then
        |Level 1 false|.output()
    endif
endmethod
