import { Injectable } from '@nestjs/common';

export interface ApnsParsedResponse {
  success: boolean;
  status: number;
  reason?: string;
}

@Injectable()
export class ApnsResponseParserService {
  parse(status: number, body?: { reason?: string }): ApnsParsedResponse {
    return {
      success: status >= 200 && status < 300,
      status,
      ...(body?.reason ? { reason: body.reason } : {}),
    };
  }
}
