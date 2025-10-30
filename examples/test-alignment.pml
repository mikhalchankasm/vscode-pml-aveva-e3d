-- Test file for Smart Column Alignment
-- Select lines and use: PML: Align PML

-- Test 1: Simple alignment with comments
!var = 100 -- first variable
!longerVariableName = 200 -- second variable
!x = 300 -- third variable

-- Test 2: Different value lengths
!result = !arr[1] -- get first element
!sum = !result + !value -- calculate sum
!name = .getName() -- get name

-- Test 3: Mixed - some with comments, some without
!a = 1 -- has comment
!b = 2
!c = 3 -- another comment
!d = 4

-- Test 4: AVEVA style with $* comments
!bore = !pipe.qreal(|BORE|) $* Pipe bore
!length = !pipe.qreal(|LENGTH|) $* Pipe length
!name = !pipe.query(|NAME|) $* Pipe name

-- Instructions:
-- 1. Select any block above
-- 2. Command Palette -> "PML: Align PML"
-- 3. Watch magic happen!
