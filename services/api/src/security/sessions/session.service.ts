import { Injectable } from '@nestjs/common';

import type { SessionEntity } from './session.entity';


@Injectable()
export class SessionService {

  private sessions: SessionEntity[] = [];


  create(
    session: SessionEntity,
  ): SessionEntity {

    this.sessions.push(session);

    return session;
  }


  list(): SessionEntity[] {
    return this.sessions;
  }

}
