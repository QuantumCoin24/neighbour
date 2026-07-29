import { Injectable } from '@nestjs/common';

import type { SessionEntity } from './session.entity';

@Injectable()
export class SessionService {
  private sessions: SessionEntity[] = [];

  create(session: SessionEntity): SessionEntity {
    this.sessions.push(session);

    return session;
  }

  findByUser(userId: string): SessionEntity[] {
    return this.sessions.filter((item) => item.userId === userId);
  }

  deactivate(id: string): SessionEntity | undefined {
    const session = this.sessions.find((item) => item.id === id);

    if (!session) {
      return undefined;
    }

    session.active = false;

    return session;
  }
}
