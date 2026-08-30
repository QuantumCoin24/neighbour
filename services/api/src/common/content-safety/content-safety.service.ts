import { BadRequestException, Injectable } from '@nestjs/common';

export interface ContentSafetyField {
  field: string;
  value: string | null | undefined;
}

type ContentSafetyRule = {
  code: string;
  pattern: RegExp;
};

@Injectable()
export class ContentSafetyService {
  private readonly rules: ContentSafetyRule[] = [
    /*
     * Severe targeted threats and encouragement of serious harm.
     *
     * Keep these deliberately narrow. Neighbour should not reject ordinary
     * discussion of crime, news, safety, health, history or quoted material
     * merely because it contains words such as "kill" or "attack".
     */
    {
      code: 'TARGETED_DEATH_THREAT',
      pattern:
        /\b(?:i(?:'|’)?ll|i\s+will|we(?:'|’)?ll|we\s+will|gonna|going\s+to)\s+(?:fucking\s+)?(?:kill|murder)\s+(?:you|him|her|them)\b/i,
    },
    {
      code: 'TARGETED_RAPE_THREAT',
      pattern:
        /\b(?:i(?:'|’)?ll|i\s+will|we(?:'|’)?ll|we\s+will|gonna|going\s+to)\s+(?:fucking\s+)?rape\s+(?:you|him|her|them)\b/i,
    },
    {
      code: 'SELF_HARM_ENCOURAGEMENT',
      pattern:
        /\b(?:kill\s+yourself|go\s+kill\s+yourself|you\s+should\s+kill\s+yourself)\b/i,
    },

    /*
     * Sexual exploitation involving children.
     *
     * These target solicitation/promotion rather than legitimate safeguarding,
     * reporting, education or discussion.
     */
    {
      code: 'CHILD_SEXUAL_SOLICITATION',
      pattern:
        /\b(?:looking\s+for|want|seeking|send|share|trade|buy|sell)\b.{0,40}\b(?:child|kid|minor|underage)\b.{0,40}\b(?:sex|sexual|nude|nudes|porn|explicit)\b/i,
    },
    {
      code: 'CHILD_SEXUAL_MATERIAL_SOLICITATION',
      pattern:
        /\b(?:child|kid|minor|underage)\b.{0,40}\b(?:porn|nudes?|sexual\s+(?:photos?|videos?)|explicit\s+(?:photos?|videos?))\b/i,
    },

    /*
     * Explicitly targeted violent instructions.
     */
    {
      code: 'TARGETED_VIOLENT_INSTRUCTION',
      pattern:
        /\b(?:someone|somebody|you)\s+should\s+(?:stab|shoot|murder|kill)\s+(?:him|her|them|that\s+(?:man|woman|person))\b/i,
    },
  ];

  assertAcceptable(...fields: ContentSafetyField[]): void {
    for (const field of fields) {
      if (typeof field.value !== 'string') {
        continue;
      }

      const value = this.normalise(field.value);

      if (!value) {
        continue;
      }

      const matchedRule = this.rules.find((rule) => rule.pattern.test(value));

      if (matchedRule) {
        throw new BadRequestException({
          statusCode: 400,
          error: 'CONTENT_REJECTED',
          message:
            'This content cannot be published because it may violate the Neighbour Community Guidelines.',
          field: field.field,
          reason: matchedRule.code,
        });
      }
    }
  }

  private normalise(value: string): string {
    return value
      .normalize('NFKC')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/[ \t\r\n]+/g, ' ')
      .trim();
  }
}
