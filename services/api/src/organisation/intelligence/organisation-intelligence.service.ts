import { Injectable } from '@nestjs/common';

@Injectable()
export class OrganisationIntelligenceService {
  analyse(input: { members: number; roles: number; businesses: number; verified: boolean }) {
    const score =
      input.members * 5 + input.roles * 3 + input.businesses * 10 + (input.verified ? 25 : 0);

    return {
      score,

      health: score >= 100 ? 'STRONG' : score >= 40 ? 'GROWING' : 'STARTING',

      signals: {
        members: input.members,
        roles: input.roles,
        businesses: input.businesses,
        verified: input.verified,
      },
    };
  }
}
