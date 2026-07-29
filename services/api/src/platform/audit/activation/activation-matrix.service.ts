import { Injectable } from '@nestjs/common';


@Injectable()
export class ActivationMatrixService {


  generate() {

    return [

      {
        domain: 'auth',
        status: 'ACTIVE',
      },

      {
        domain: 'community',
        status: 'ACTIVE',
      },

      {
        domain: 'profile',
        status: 'ACTIVE',
      },

      {
        domain: 'marketplace',
        status: 'FOUNDATION',
      },

      {
        domain: 'payments',
        status: 'FOUNDATION',
      },

    ];

  }


}
