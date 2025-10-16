-- ============================================
-- Тестирование skip if и других специальных конструкций
-- ============================================

define method .testSkipIf()
    !lBores = ARRAY()
    !lBores.append(|100|)
    !lBores.append(|200|)
    !lBores.append(|300|)
    !lBores.append(||)  -- пустая строка
    
    !sequence = !lBores.size()
    
    do !i from !sequence - 1 to 1 by -1
        skip if(!lBores[!i].eq(''))
        !this.arriveBore = !lBores[!i].bore()
        break
    enddo
endmethod

define method .testBreakContinue()
    !count = 0
    
    do !i from 1 to 10
        if (!i eq 3) then
            continue
        endif
        
        if (!i eq 7) then
            break
        endif
        
        !count = !count + 1
    enddo
    
    return !count
endmethod

define method .testReturn()
    !value = 42
    
    if (!value gt 0) then
        return TRUE
    else
        return FALSE
    endif
endmethod

define method .complexExample()
    !items = ARRAY()
    !items.append(|item1|)
    !items.append(||)  -- пустой
    !items.append(|item3|)
    
    do !item values !items
        skip if(!item.eq(''))
        
        !name = !item.upcase()
        !name.output()
        
        if (!name.match(|ITEM|)) then
            break
        endif
    enddo
endmethod
