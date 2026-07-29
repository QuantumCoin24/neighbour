import { Injectable } from '@nestjs/common';

export interface ApnsParsedResponse {
  accepted: boolean;
  status: number;
  reason?: string;
}

@Injectable()
export class ApnsResponseParserService {
  parse(status: number, body?: string): ApnsParsedResponse {
    let reason: string | undefined;

    if (body) {
      try {
        const parsed = JSON.parse(body) as {
          reason?: unknown;
        };

        if (typeof parsed.reason === 'string') {
          reason = parsed.reason;
        }
      } catch {
        // Ignore malformed response bodies.
      }
    }

    return {
      accepted: status === 200,
      status,
      ...(reason !== undefined ? { reason } : {}),
    };
  }
}
