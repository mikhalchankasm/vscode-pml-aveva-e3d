-- Type Inference Test File
-- Testing smart completions based on variable types

-- Test 1: ARRAY type inference
define method .testArrayCompletion()
	!k = object array()
	!k.append(|test|)  -- After typing !k. you should see ARRAY methods only
	!size = !k.size()
	!first = !k.first()
endmethod

-- Test 2: STRING type inference
define method .testStringCompletion()
	!name = |Hello World|
	!upper = !name.upcase()  -- After typing !name. you should see STRING methods only
	!len = !name.length()
	!sub = !name.substring(1, 5)
endmethod

-- Test 3: REAL type inference
define method .testRealCompletion()
	!num = 123.45
	!abs = !num.abs()  -- After typing !num. you should see REAL methods only
	!str = !num.string()
endmethod

-- Test 4: Mixed types
define method .testMixedTypes()
	!arr = object array()
	!arr.append(|item1|)
	!arr.append(|item2|)

	!text = |Test|
	!text = !text.upcase()

	!count = !arr.size()
	!doubled = !count * 2
endmethod

-- Test 5: Control flow type inference
define method .testControlFlow()
	!result = ||

	if (condition) then
		!result = |TRUE|
	else
		!result = |FALSE|
	endif

	-- !result should be inferred as STRING
	!upper = !result.upcase()
endmethod

-- Test 6: Do loop type inference
define method .testDoLoop()
	!names = object array()
	!names.append(|Alice|)
	!names.append(|Bob|)

	do !name values !names
		-- !name should be inferred as element type of !names
		!upper = !name.upcase()
	enddo
endmethod
