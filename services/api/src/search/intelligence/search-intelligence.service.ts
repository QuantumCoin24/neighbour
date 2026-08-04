import { Injectable } from '@nestjs/common';

@Injectable()
export class SearchIntelligenceService {
  rank<T>(items: T[], score: (item: T) => number): T[] {
    return [...items].sort((a, b) => score(b) - score(a));
  }

  scoreText(text: string, query: string): number {
    const value = text.toLowerCase();

    const term = query.toLowerCase();

    if (value === term) {
      return 100;
    }

    if (value.includes(term)) {
      return 50;
    }

    return 10;
  }
}
