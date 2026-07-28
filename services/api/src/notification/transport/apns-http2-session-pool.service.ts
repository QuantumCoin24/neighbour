import { Injectable } from '@nestjs/common';

export interface ApnsSession {
  id: string;
  createdAt: Date;
  active: boolean;
}

@Injectable()
export class ApnsHttp2SessionPoolService {
  private readonly sessions = new Map<string, ApnsSession>();

  acquire(id: string): ApnsSession {
    const existing = this.sessions.get(id);

    if (existing) {
      return existing;
    }

    const session: ApnsSession = {
      id,
      createdAt: new Date(),
      active: true,
    };

    this.sessions.set(id, session);

    return session;
  }

  release(id: string): void {
    const session = this.sessions.get(id);

    if (!session) {
      return;
    }

    session.active = false;
  }

  size(): number {
    return this.sessions.size;
  }

  clear(): void {
    this.sessions.clear();
  }
}
