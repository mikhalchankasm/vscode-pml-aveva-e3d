import { PMLType, typeToString } from '../ast/nodes';

export function formatPmlTypeLabel(type?: PMLType): string | undefined {
	if (!type) return undefined;
	return type.kind === 'ARRAY' && type.elementType.kind === 'ANY'
		? 'ARRAY'
		: typeToString(type);
}

export function formatCallableParameter(name: string, type?: PMLType): string {
	const parameterName = name.startsWith('!') ? name : `!${name}`;
	const typeLabel = formatPmlTypeLabel(type);
	return typeLabel ? `${parameterName} is ${typeLabel}` : parameterName;
}

export function formatCallableParameters(parameters: string[], parameterTypes: Array<PMLType | undefined> = []): string[] {
	return parameters.map((parameter, index) => formatCallableParameter(parameter, parameterTypes[index]));
}

export function formatCallableSignature(
	prefix: '.' | '!!',
	name: string,
	parameters: string[],
	parameterTypes: Array<PMLType | undefined> = [],
	returnType?: PMLType
): string {
	const returnLabel = formatPmlTypeLabel(returnType);
	return `${prefix}${name}(${formatCallableParameters(parameters, parameterTypes).join(', ')})${returnLabel ? ` is ${returnLabel}` : ''}`;
}

export function formatCallableDetail(
	parameters: string[],
	parameterTypes: Array<PMLType | undefined> = [],
	returnType?: PMLType
): string {
	const returnLabel = formatPmlTypeLabel(returnType);
	return `(${formatCallableParameters(parameters, parameterTypes).join(', ')})${returnLabel ? ` → ${returnLabel}` : ''}`;
}

export function formatCallableSnippet(prefix: '.' | '!!' | '', name: string, parameters: string[]): string {
	const argumentsText = parameters.map((parameter, index) => {
		const parameterName = parameter.startsWith('!') ? parameter : `!${parameter}`;
		return `\${${index + 1}:${parameterName}}`;
	}).join(', ');
	return `${prefix}${name}(${argumentsText})$0`;
}
