-- Test file for new array commands

-- Test 1: ReIndex command
-- Select lines below and use: PML - Array -> ReIndex
-- Expected: indices should be renumbered from 4 to 8

!lines[1] = 'string value 1'
!lines[2] = 'string value 2'
!lines[3] = 'string value 3'
!lines[3] = 'string value 4'
!lines[3] = 'string value 5'
!lines[3] = 'string value 6'
!lines[3] = 'string value 7'
!lines[ 8] = 'string value 8'

-- Test 2: Add to Array command
-- Select the array and plain values below, then use: PML - Array -> Add to Array
-- Expected: plain values should be added as new array elements

!items[1] = 'first item'
!items[2] = 'second item'
!items[3] = 'third item'
some value 1
some value 2
some value 3

-- Test 3: Make Array commands
-- Select plain values below and use: PML - Array -> Make Array (add /)
!list[1] = /value1
!list[2] = /value2
!list[3] = /value3

-- Test 4: ReIndex with path arrays
!list[1] =  'path/to/file1'
!list[2] =  'path/to/file2'
!list[3] =  'path/to/file3'
!list[4] =  'path/to/file4'
!list[ 9] = 'path/to/file5'


