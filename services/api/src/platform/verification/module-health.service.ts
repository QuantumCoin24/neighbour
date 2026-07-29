import { Injectable } from '@nestjs/common';

@Injectable()
export class ModuleHealthService {

  private modules = [
    'identity',
    'profile',
    'community',
    'payments',
    'security',
    'analytics',
  ];


  list() {
    return this.modules.map(module => ({
      module,
      status: 'active',
    }));
  }

}
