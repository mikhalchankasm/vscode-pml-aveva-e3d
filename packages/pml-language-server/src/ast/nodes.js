"use strict";
/**
 * AST Node definitions for PML Language
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStringType = createStringType;
exports.createRealType = createRealType;
exports.createIntegerType = createIntegerType;
exports.createBooleanType = createBooleanType;
exports.createArrayType = createArrayType;
exports.createDBRefType = createDBRefType;
exports.createAnyType = createAnyType;
exports.createUndefinedType = createUndefinedType;
exports.createUnionType = createUnionType;
exports.isTypeEqual = isTypeEqual;
exports.typeToString = typeToString;
/**
 * Type helper functions
 */
function createStringType() {
    return { kind: 'STRING' };
}
function createRealType() {
    return { kind: 'REAL' };
}
function createIntegerType() {
    return { kind: 'INTEGER' };
}
function createBooleanType() {
    return { kind: 'BOOLEAN' };
}
function createArrayType(elementType = { kind: 'ANY' }) {
    return { kind: 'ARRAY', elementType };
}
function createDBRefType() {
    return { kind: 'DBREF' };
}
function createAnyType() {
    return { kind: 'ANY' };
}
function createUndefinedType() {
    return { kind: 'UNDEFINED' };
}
function createUnionType(types) {
    return { kind: 'UNION', types };
}
/**
 * Type equality check
 */
function isTypeEqual(a, b) {
    if (a.kind !== b.kind) {
        return false;
    }
    if (a.kind === 'ARRAY' && b.kind === 'ARRAY') {
        return isTypeEqual(a.elementType, b.elementType);
    }
    if (a.kind === 'UNION' && b.kind === 'UNION') {
        if (a.types.length !== b.types.length) {
            return false;
        }
        return a.types.every((t, i) => isTypeEqual(t, b.types[i]));
    }
    return true;
}
/**
 * Type to string
 */
function typeToString(type) {
    switch (type.kind) {
        case 'STRING':
            return 'STRING';
        case 'REAL':
            return 'REAL';
        case 'INTEGER':
            return 'INTEGER';
        case 'BOOLEAN':
            return 'BOOLEAN';
        case 'ARRAY':
            return `ARRAY<${typeToString(type.elementType)}>`;
        case 'DBREF':
            return 'DBREF';
        case 'ANY':
            return 'ANY';
        case 'UNDEFINED':
            return 'UNDEFINED';
        case 'UNION':
            return type.types.map(typeToString).join(' | ');
    }
}
//# sourceMappingURL=nodes.js.map