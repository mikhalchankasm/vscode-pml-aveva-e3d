-- Test arr[0] detection

define method .testArrayZero()

	!arr = object ARRAY()
	!arr.Append(10)
	!arr.Append(20)
	!arr.Append(30)

	-- This should trigger error: Array indices start at 1
	!value = !arr[0]

	-- This is correct
	!first = !arr[1]

	-- Test in if statement
	if (!arr[0] eq 10) then
		$P Value is: $!arr[0]
	endif

	-- Test with elseif
	if (!arr[1] eq 10) then
		$P First element is 10
	elseif (!arr[0] eq 20) then
		$P This should show error on arr[0]
	else
		$P Something else
	endif

endmethod
