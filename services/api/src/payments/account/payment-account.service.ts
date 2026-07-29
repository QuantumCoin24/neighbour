import { Injectable } from '@nestjs/common';

import type { PaymentAccountEntity } from './payment-account.entity';

@Injectable()
export class PaymentAccountService {
  private accounts: PaymentAccountEntity[] = [];

  create(account: PaymentAccountEntity): PaymentAccountEntity {
    this.accounts.push(account);

    return account;
  }

  findByOwner(ownerId: string): PaymentAccountEntity | undefined {
    return this.accounts.find((account) => account.ownerId === ownerId);
  }
}
