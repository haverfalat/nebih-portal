export class MemoryCache<T> {
  private readonly entries = new Map<string, { value: T; expires: number }>();

  constructor(
    private readonly ttl: number,
    private readonly capacity: number,
  ) {}

  get(key: string): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    this.entries.delete(key);
    if (entry.expires <= Date.now()) return undefined;
    this.entries.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T): void {
    if (this.capacity === 0 || this.ttl === 0) return;
    this.entries.delete(key);
    this.entries.set(key, { value, expires: Date.now() + this.ttl });
    while (this.entries.size > this.capacity) {
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) this.entries.delete(oldest);
    }
  }

  clear(): void {
    this.entries.clear();
  }
}
