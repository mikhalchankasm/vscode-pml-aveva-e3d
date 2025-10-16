/**
 * Определения методов для базовых типов PML
 */

export interface MethodSignature {
    name: string;
    params: string[];
    returnType: string;
    description: string;
}

/**
 * STRING методы (из STRING Object.md)
 */
export const STRING_METHODS: MethodSignature[] = [
    { name: 'After', params: ['STRING two'], returnType: 'STRING', description: 'Return sub-string following leftmost occurrence of sub-string two' },
    { name: 'Before', params: ['STRING two'], returnType: 'STRING', description: 'Return sub-string before leftmost occurrence of sub-string two' },
    { name: 'Block', params: [], returnType: 'BLOCK', description: 'Make STRING into a BLOCK for evaluation' },
    { name: 'Boolean', params: [], returnType: 'BOOLEAN', description: "TRUE if STRING is 'TRUE', 'T', 'YES' or 'Y'; FALSE otherwise" },
    { name: 'Bore', params: [], returnType: 'BORE', description: 'Convert STRING to a BORE (exact conversion)' },
    { name: 'Bore', params: ['FORMAT'], returnType: 'BORE', description: 'Convert STRING to a BORE using FORMAT settings' },
    { name: 'DBRef', params: [], returnType: 'DBREF', description: 'Convert STRING to a DBREF' },
    { name: 'DBRef', params: ['FORMAT'], returnType: 'DBREF', description: 'Convert STRING to a DBREF using format object' },
    { name: 'Digits', params: [], returnType: 'REAL', description: 'Return positive value if string contains only digits, else -1.0' },
    { name: 'Direction', params: [], returnType: 'DIRECTION', description: 'Convert STRING to a DIRECTION' },
    { name: 'Direction', params: ['FORMAT'], returnType: 'DIRECTION', description: 'Convert STRING to a DIRECTION using format object' },
    { name: 'Empty', params: [], returnType: 'BOOLEAN', description: 'TRUE for empty zero-length string' },
    { name: 'EQNoCase', params: ['STRING'], returnType: 'BOOLEAN', description: 'Compare equal ignoring case' },
    { name: 'isDigits', params: [], returnType: 'BOOLEAN', description: 'TRUE if string contains only decimal digits' },
    { name: 'isLetters', params: [], returnType: 'BOOLEAN', description: 'TRUE if string contains only letters' },
    { name: 'isLettersAndDigits', params: [], returnType: 'BOOLEAN', description: 'TRUE if string contains only letters and digits' },
    { name: 'Length', params: [], returnType: 'REAL', description: 'Number of characters in string' },
    { name: 'LowCase', params: [], returnType: 'STRING', description: 'Convert string to lower case' },
    { name: 'LT', params: ['STRING'], returnType: 'BOOLEAN', description: 'Comparison using ASCII collating sequence' },
    { name: 'Match', params: ['STRING two'], returnType: 'REAL', description: 'Location of sub-string two (0 if not found)' },
    { name: 'MatchWild', params: ['STRING two'], returnType: 'BOOLEAN', description: 'Wildcard match (* for any chars, ? for single char)' },
    { name: 'MatchWild', params: ['STRING two', 'STRING multiple'], returnType: 'BOOLEAN', description: 'Wildcard match with custom multiple wildcard' },
    { name: 'MatchWild', params: ['STRING two', 'STRING multiple', 'STRING single'], returnType: 'BOOLEAN', description: 'Wildcard match with custom wildcards' },
    { name: 'Occurs', params: ['STRING'], returnType: 'REAL', description: 'Number of occurrences of given string' },
    { name: 'Orientation', params: [], returnType: 'ORIENTATION', description: 'Convert STRING to ORIENTATION' },
    { name: 'Orientation', params: ['FORMAT'], returnType: 'ORIENTATION', description: 'Convert STRING to ORIENTATION using format' },
    { name: 'Part', params: ['REAL nth'], returnType: 'STRING', description: 'Extract nth field (space/tab/newline delimited)' },
    { name: 'Part', params: ['REAL nth', 'STRING delim'], returnType: 'STRING', description: 'Extract nth field with custom delimiter' },
    { name: 'Position', params: [], returnType: 'POSITION', description: 'Convert STRING to POSITION' },
    { name: 'Position', params: ['FORMAT'], returnType: 'POSITION', description: 'Convert STRING to POSITION using format' },
    { name: 'REAL', params: [], returnType: 'REAL', description: 'Convert to a number' },
    { name: 'Replace', params: ['STRING two', 'STRING three'], returnType: 'STRING', description: 'Replace all occurrences of two with three' },
    { name: 'Replace', params: ['STRING two', 'STRING three', 'REAL nth'], returnType: 'STRING', description: 'Replace from nth occurrence' },
    { name: 'Replace', params: ['STRING two', 'STRING three', 'REAL nth', 'REAL count'], returnType: 'STRING', description: 'Replace count occurrences from nth' },
    { name: 'Split', params: [], returnType: 'ARRAY', description: 'Split string into ARRAY at spaces' },
    { name: 'Split', params: ['STRING delim'], returnType: 'ARRAY', description: 'Split string into ARRAY at delimiter' },
    { name: 'String', params: ['BLOCK'], returnType: 'STRING', description: 'Creates STRING from BLOCK' },
    { name: 'String', params: ['BOOLEAN'], returnType: 'STRING', description: 'Creates STRING from BOOLEAN (TRUE/FALSE)' },
    { name: 'String', params: ['BOOLEAN', 'FORMAT'], returnType: 'STRING', description: 'Creates STRING from BOOLEAN with format' },
    { name: 'Substring', params: ['REAL index', 'REAL nchars'], returnType: 'STRING', description: 'Sub-string, nchars long, starting at index' },
    { name: 'Substring', params: ['REAL index'], returnType: 'STRING', description: 'Sub-string from index to end' },
    { name: 'Trim', params: [], returnType: 'STRING', description: 'Remove initial and trailing spaces' },
    { name: 'Trim', params: ["STRING 'options'"], returnType: 'STRING', description: "Remove spaces (L=left, R=right, LR=both)" },
    { name: 'Trim', params: ['STRING options', 'STRING char'], returnType: 'STRING', description: 'Reduce multiple char to single (options=M)' },
    { name: 'UpCase', params: [], returnType: 'STRING', description: 'Convert STRING to upper case' },
    { name: 'VLogical', params: [], returnType: 'BOOLEAN', description: 'Evaluate STRING as BOOLEAN' },
    { name: 'VText', params: [], returnType: 'STRING', description: 'Evaluate STRING as STRING' },
    { name: 'VValue', params: [], returnType: 'REAL', description: 'Evaluate STRING as REAL' },
];

/**
 * REAL методы
 */
export const REAL_METHODS: MethodSignature[] = [
    { name: 'Abs', params: [], returnType: 'REAL', description: 'Absolute value' },
    { name: 'Ceiling', params: [], returnType: 'REAL', description: 'Smallest integer >= value' },
    { name: 'Floor', params: [], returnType: 'REAL', description: 'Largest integer <= value' },
    { name: 'Round', params: [], returnType: 'REAL', description: 'Round to nearest integer' },
    { name: 'String', params: [], returnType: 'STRING', description: 'Convert to STRING' },
    { name: 'String', params: ['FORMAT'], returnType: 'STRING', description: 'Convert to STRING with format' },
];

/**
 * ARRAY методы
 */
export const ARRAY_METHODS: MethodSignature[] = [
    { name: 'Append', params: ['ANY item'], returnType: 'VOID', description: 'Add item to end of array' },
    { name: 'AppendArray', params: ['ARRAY other'], returnType: 'VOID', description: 'Append all items from other array' },
    { name: 'Remove', params: ['ANY item'], returnType: 'VOID', description: 'Remove first occurrence of item' },
    { name: 'RemoveAt', params: ['REAL index'], returnType: 'VOID', description: 'Remove item at index (1-based)' },
    { name: 'Size', params: [], returnType: 'REAL', description: 'Number of items in array' },
    { name: 'Empty', params: [], returnType: 'BOOLEAN', description: 'TRUE if array is empty' },
    { name: 'First', params: [], returnType: 'ANY', description: 'First element of array' },
    { name: 'Last', params: [], returnType: 'ANY', description: 'Last element of array' },
    { name: 'Evaluate', params: ['BLOCK'], returnType: 'ARRAY', description: 'Create new array by evaluating block for each item' },
];

/**
 * DBREF методы (AVEVA E3D элементы)
 */
export const DBREF_METHODS: MethodSignature[] = [
    { name: 'Query', params: ['STRING attribute'], returnType: 'ANY', description: 'Query element attribute (NAME, TYPE, BORE, etc.)' },
    { name: 'String', params: [], returnType: 'STRING', description: 'Convert DBREF to string representation' },
];

/**
 * Все методы для completion
 */
export const ALL_TYPE_METHODS = {
    'STRING': STRING_METHODS,
    'REAL': REAL_METHODS,
    'ARRAY': ARRAY_METHODS,
    'DBREF': DBREF_METHODS,
};

