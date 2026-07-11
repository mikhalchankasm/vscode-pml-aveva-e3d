/** Returns only a statically direct form callback target; dynamic callback text is intentionally excluded. */
export function directCallbackTarget(callback?: string): string | undefined {
	return callback?.trim().match(/^(?:!this\.|\.)?([A-Za-z_][A-Za-z0-9_]*)\s*\(/i)?.[1];
}
