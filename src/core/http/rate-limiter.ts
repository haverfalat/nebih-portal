import { setTimeout as delay } from 'node:timers/promises';

export class RateLimiter {
  private nextStart = 0;

  constructor(private readonly interval: number) {}

  async reserve(signal: AbortSignal): Promise<void> {
    const now = Date.now();
    const start = Math.max(now, this.nextStart);
    this.nextStart = start + this.interval;
    if (start > now) await delay(start - now, undefined, { signal });
    signal.throwIfAborted();
  }
}
