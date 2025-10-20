-- Test file for type inference and type checking
-- Test Phase 1.4: Type Inference Engine

define method .testTypeInference()

    -- Test 1: Literal type inference
    !name = 'John Doe'           -- STRING
    !count = 42                  -- INTEGER
    !price = 19.99               -- REAL
    !isValid = true              -- BOOLEAN

    -- Test 2: Method call type inference
    !upperName = !name.upcase()  -- STRING (from STRING.upcase())
    !nameLength = !name.length() -- REAL (from STRING.length())

    -- Test 3: REAL method type inference
    !absValue = !price.abs()     -- REAL
    !rounded = !price.round()    -- REAL
    !priceStr = !price.string()  -- STRING

    -- Test 4: Collection type inference
    !items = ARRAY()             -- ARRAY
    !itemCount = !items.size()   -- REAL
    !firstItem = !items.first()  -- ANY

    -- Test 5: DBREF query
    !collection = !!collectallfor('PIPE', |Lissue eq false|)  -- ARRAY of DBREF

    do !element values !collection
        -- !element should be DBREF
        !elementName = !element.query(|NAME|)  -- STRING
        !bore = !element.qreal(|BORE|)         -- REAL
    enddo

    -- Test 6: Array index validation (should error on [0])
    !myArray = ARRAY()
    !myArray.append(|item1|)
    !myArray.append(|item2|)
    !myArray.append(|item3|)

    -- This should work (1-indexed)
    !first = !myArray[1]   -- OK

    -- This should cause ERROR (0-indexed)
    !wrong = !myArray[0]   -- ERROR: Array indices start at 1

    -- Test 7: String concatenation
    !fullName = !name & | - | & !upperName  -- STRING

    -- Test 8: Arithmetic operations
    !total = !count + !price     -- REAL
    !double = !count * 2         -- REAL
    !half = !price / 2.0         -- REAL

    -- Test 9: Comparison (returns BOOLEAN)
    !isExpensive = !price gt 10.0     -- BOOLEAN
    !isZero = !count eq 0             -- BOOLEAN

endmethod

!k = object ARRAY()
!k.remove