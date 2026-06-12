import { FileChangeType, FileEvent } from 'vscode-languageserver/node';

type FlushCallback = (changes: FileEvent[]) => void;

export class FileChangeDebouncer {
	private readonly pendingChanges = new Map<string, FileEvent>();
	private timer?: NodeJS.Timeout;
	private maxWaitTimer?: NodeJS.Timeout;

	constructor(
		private readonly delayMs: number,
		private readonly flush: FlushCallback,
		private readonly maxWaitMs = delayMs * 8
	) {}

	public enqueue(changes: FileEvent[]): void {
		const wasEmpty = this.pendingChanges.size === 0;
		for (const change of changes) {
			this.pendingChanges.set(change.uri, this.mergeChange(this.pendingChanges.get(change.uri), change));
		}

		if (this.timer) {
			clearTimeout(this.timer);
		}

		this.timer = setTimeout(() => this.flushPending(), this.delayMs);
		if (wasEmpty && this.maxWaitMs > this.delayMs) {
			this.maxWaitTimer = setTimeout(() => this.flushPending(), this.maxWaitMs);
		}
	}

	public flushNow(): void {
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = undefined;
		}
		if (this.maxWaitTimer) {
			clearTimeout(this.maxWaitTimer);
			this.maxWaitTimer = undefined;
		}

		this.flushPending();
	}

	private flushPending(): void {
		if (this.pendingChanges.size === 0) {
			return;
		}

		const changes = Array.from(this.pendingChanges.values());
		this.pendingChanges.clear();
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = undefined;
		}
		if (this.maxWaitTimer) {
			clearTimeout(this.maxWaitTimer);
			this.maxWaitTimer = undefined;
		}
		this.flush(changes);
	}

	private mergeChange(previous: FileEvent | undefined, next: FileEvent): FileEvent {
		if (!previous) {
			return next;
		}

		if (next.type === FileChangeType.Deleted) {
			return next;
		}

		if (previous.type === FileChangeType.Deleted) {
			return next;
		}

		if (previous.type === FileChangeType.Created) {
			return previous;
		}

		return next;
	}
}
