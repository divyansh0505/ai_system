/**
 * Simple delay-based rate limiter.
 * Ensures minimum delay between operations.
 */
export class RateLimiter {
  private lastCallTime: number = 0;
  private readonly minDelayMs: number;

  /**
   * @param minDelayMs - Minimum milliseconds between operations (default: 150ms = ~6.6 ops/sec)
   */
  constructor(minDelayMs: number = 150) {
    this.minDelayMs = minDelayMs;
  }

  async wait(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;

    if (timeSinceLastCall < this.minDelayMs) {
      const waitTime = this.minDelayMs - timeSinceLastCall;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastCallTime = Date.now();
  }
}
