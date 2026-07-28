import { Injectable } from '@nestjs/common';

@Injectable()
export class BadgeCounterService {
  private readonly counts = new Map<string, number>();

  get(userId: string): number {
    return this.counts.get(userId) ?? 0;
  }

  increment(userId: string): number {
    const value = this.get(userId) + 1;
    this.counts.set(userId, value);
    return value;
  }

  decrement(userId: string): number {
    const value = Math.max(0, this.get(userId) - 1);
    this.counts.set(userId, value);
    return value;
  }

  clear(userId: string): void {
    this.counts.set(userId, 0);
  }

  reset(): void {
    this.counts.clear();
  }
}
