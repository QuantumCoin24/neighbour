import { Injectable } from '@nestjs/common';

@Injectable()
export class SystemMapService {

  generate() {

    return [
      'identity',
      'community',
      'interaction',
      'trust',
      'analytics',
    ];

  }

}
