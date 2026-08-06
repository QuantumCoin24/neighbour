import { BadRequestException, Injectable } from '@nestjs/common';

import type { AppleTransactionPayload } from '../interfaces/apple-product.interface';

interface RawAppleTransaction {
  transactionId?: unknown;
  originalTransactionId?: unknown;
  productId?: unknown;
  bundleId?: unknown;
  appAccountToken?: unknown;
  purchaseDate?: unknown;
  expiresDate?: unknown;
  revocationDate?: unknown;
  environment?: unknown;
}

@Injectable()
export class AppleTransactionDecoderService {
  decode(signedTransactionInfo: string): AppleTransactionPayload {
    const parts = signedTransactionInfo.split('.');

    if (parts.length !== 3 || parts.some((part) => part.length === 0)) {
      throw new BadRequestException('Apple transaction must use compact JWS format.');
    }

    const encodedPayload = parts[1];

    if (!encodedPayload) {
      throw new BadRequestException('Apple transaction payload is missing.');
    }

    let raw: RawAppleTransaction;

    try {
      raw = JSON.parse(
        Buffer.from(encodedPayload, 'base64url').toString('utf8'),
      ) as RawAppleTransaction;
    } catch {
      throw new BadRequestException('Apple transaction payload is not valid JSON.');
    }

    const transactionId = this.requireString(raw.transactionId, 'transactionId');

    const originalTransactionId = this.requireString(
      raw.originalTransactionId,
      'originalTransactionId',
    );

    const productId = this.requireString(raw.productId, 'productId');

    const purchaseDate = this.requireDate(raw.purchaseDate, 'purchaseDate');

    const expiresDate = this.requireDate(raw.expiresDate, 'expiresDate');

    const revocationDate =
      raw.revocationDate === undefined || raw.revocationDate === null
        ? null
        : this.requireDate(raw.revocationDate, 'revocationDate');

    const environment =
      raw.environment === 'Sandbox' || raw.environment === 'Production' ? raw.environment : null;

    return {
      transactionId,
      originalTransactionId,
      productId,
      bundleId: this.optionalString(raw.bundleId),
      appAccountToken: this.optionalString(raw.appAccountToken),
      purchaseDate,
      expiresDate,
      revocationDate,
      environment,
    };
  }

  private requireString(value: unknown, field: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new BadRequestException(`Apple transaction is missing ${field}.`);
    }

    return value.trim();
  }

  private optionalString(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
  }

  private requireDate(value: unknown, field: string): Date {
    const milliseconds =
      typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;

    const date = new Date(milliseconds);

    if (!Number.isFinite(milliseconds) || Number.isNaN(date.getTime())) {
      throw new BadRequestException(`Apple transaction contains an invalid ${field}.`);
    }

    return date;
  }
}
