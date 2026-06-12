import { FileChangeType, FileEvent } from 'vscode-languageserver/node';

type FlushCallback = (changes: FileEvent[]) => void;

export class FileChangeDebouncer {
	private readonly pendingChanges = new Map<string, FileEvent>();
	private timer?: NodeJS.Timeout;

	constructor(
		private readonly delayMs: number,
		private readonly flush: FlushCallback
	) {}

	public enqueue(changes: FileEvent[]): void {
		for (const change of changes) {
			this.pendingChanges.set(change.uri, this.mergeChange(this.pendingChanges.get(change.uri), change));
		}

		if (this.timer) {
			clearTimeout(this.timer);
		}

		this.timer = setTimeout(() => this.flushPending(), this.delayMs);
	}

	public flushNow(): void {
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = undefined;
		}

		this.flushPending();
	}

	private flushPending(): void {
		if (this.pendingChanges.size === 0) {
			return;
		}

		const changes = Array.from(this.pendingChanges.values());
		this.pendingChanges.clear();
		this.timer = undefined;
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
			return previous;
		}

		if (previous.type === FileChangeType.Created) {
			return previous;
		}

		return next;
	}
}
