import { describe, expect, it, vi } from 'vitest';
import { FileChangeType, FileEvent } from 'vscode-languageserver/node';
import { FileChangeDebouncer } from '../fileChangeDebouncer';

describe('FileChangeDebouncer', () => {
	it('coalesces repeated changes for the same uri into one flush', () => {
		vi.useFakeTimers();
		try {
			const flush = vi.fn();
			const debouncer = new FileChangeDebouncer(250, flush);
			const uri = 'file:///workspace/form.pmlfrm';

			debouncer.enqueue([{ uri, type: FileChangeType.Changed }]);
			debouncer.enqueue([{ uri, type: FileChangeType.Changed }]);
			vi.advanceTimersByTime(249);

			expect(flush).not.toHaveBeenCalled();

			vi.advanceTimersByTime(1);

			expect(flush).toHaveBeenCalledTimes(1);
			expect(flush).toHaveBeenCalledWith([{ uri, type: FileChangeType.Changed }]);
		} finally {
			vi.useRealTimers();
		}
	});

	it('preserves created and deleted intent when changes are merged', () => {
		const flush = vi.fn();
		const debouncer = new FileChangeDebouncer(250, flush);
		const createdUri = 'file:///workspace/new.pml';
		const deletedUri = 'file:///workspace/old.pml';
		const changes: FileEvent[] = [
			{ uri: createdUri, type: FileChangeType.Created },
			{ uri: createdUri, type: FileChangeType.Changed },
			{ uri: deletedUri, type: FileChangeType.Changed },
			{ uri: deletedUri, type: FileChangeType.Deleted },
			{ uri: deletedUri, type: FileChangeType.Changed }
		];

		debouncer.enqueue(changes);
		debouncer.flushNow();

		expect(flush).toHaveBeenCalledWith([
			{ uri: createdUri, type: FileChangeType.Created },
			{ uri: deletedUri, type: FileChangeType.Deleted }
		]);
	});
});
