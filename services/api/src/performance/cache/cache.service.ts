import { Injectable } from '@nestjs/common';

@Injectable()
export class CacheService {
  private cache = new Map<string, unknown>();

  set(key: string, value: unknown) {
    this.cache.set(key, value);

    return {
      cached: true,

      key,
    };
  }

  get(key: string) {
    return this.cache.get(key);
  }

  has(key: string) {
    return this.cache.has(key);
  }

  clear() {
    this.cache.clear();

    return {
      cleared: true,
    };
  }
}
