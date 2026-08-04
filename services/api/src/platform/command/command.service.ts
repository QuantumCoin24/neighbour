import { Injectable } from '@nestjs/common';

import type { CommandEntity } from './command.entity';

@Injectable()
export class CommandService {
  create(command: CommandEntity): CommandEntity {
    return command;
  }
}
