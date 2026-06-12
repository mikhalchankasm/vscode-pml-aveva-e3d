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
		const recreatedUri = 'file:///workspace/recreated.pml';
		const deletedUri = 'file:///workspace/deleted.pml';
		const changes: FileEvent[] = [
			{ uri: createdUri, type: FileChangeType.Created },
			{ uri: createdUri, type: FileChangeType.Changed },
			{ uri: recreatedUri, type: FileChangeType.Changed },
			{ uri: recreatedUri, type: FileChangeType.Deleted },
			{ uri: recreatedUri, type: FileChangeType.Created },
			{ uri: deletedUri, type: FileChangeType.Changed },
			{ uri: deletedUri, type: FileChangeType.Deleted }
		];

		debouncer.enqueue(changes);
		debouncer.flushNow();

		expect(flush).toHaveBeenCalledWith([
			{ uri: createdUri, type: FileChangeType.Created },
			{ uri: recreatedUri, type: FileChangeType.Created },
			{ uri: deletedUri, type: FileChangeType.Deleted }
		]);
	});

	it('flushes during sustained bursts after the max wait expires', () => {
		vi.useFakeTimers();
		try {
			const flush = vi.fn();
			const debouncer = new FileChangeDebouncer(250, flush, 1000);

			for (let index = 0; index < 5; index++) {
				debouncer.enqueue([{ uri: `file:///workspace/file${index}.pml`, type: FileChangeType.Changed }]);
				vi.advanceTimersByTime(200);
			}

			expect(flush).toHaveBeenCalledTimes(1);
			expect(flush.mock.calls[0][0]).toHaveLength(5);
		} finally {
			vi.useRealTimers();
		}
	});

	it('does not let stale trailing timers flush a new burst after max wait', () => {
		vi.useFakeTimers();
		try {
			const flush = vi.fn();
			const debouncer = new FileChangeDebouncer(250, flush, 1000);

			debouncer.enqueue([{ uri: 'file:///workspace/first.pml', type: FileChangeType.Changed }]);
			vi.advanceTimersByTime(200);
			debouncer.enqueue([{ uri: 'file:///workspace/second.pml', type: FileChangeType.Changed }]);
			vi.advanceTimersByTime(200);
			debouncer.enqueue([{ uri: 'file:///workspace/third.pml', type: FileChangeType.Changed }]);
			vi.advanceTimersByTime(200);
			debouncer.enqueue([{ uri: 'file:///workspace/fourth.pml', type: FileChangeType.Changed }]);
			vi.advanceTimersByTime(200);
			debouncer.enqueue([{ uri: 'file:///workspace/fifth.pml', type: FileChangeType.Changed }]);
			vi.advanceTimersByTime(200);

			expect(flush).toHaveBeenCalledTimes(1);
			expect(flush.mock.calls[0][0]).toHaveLength(5);

			debouncer.enqueue([{ uri: 'file:///workspace/sixth.pml', type: FileChangeType.Changed }]);
			vi.advanceTimersByTime(49);

			expect(flush).toHaveBeenCalledTimes(1);

			vi.advanceTimersByTime(201);

			expect(flush).toHaveBeenCalledTimes(2);
			expect(flush.mock.calls[1][0]).toEqual([
				{ uri: 'file:///workspace/sixth.pml', type: FileChangeType.Changed }
			]);
		} finally {
			vi.useRealTimers();
		}
	});
});
