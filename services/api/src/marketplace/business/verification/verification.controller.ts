import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { VerificationService } from './verification.service';

@Controller('businesses')
export class VerificationController {
  constructor(private readonly service: VerificationService) {}

  @Post(':businessId/verification')
  submit(
    @Param('businessId')
    businessId: string,

    @Body()
    body: {
      notes?: string;
    },
  ) {
    return this.service.submit({
      businessId,

      ...(body.notes ? { notes: body.notes } : {}),
    });
  }

  @Get(':businessId/verification')
  find(
    @Param('businessId')
    businessId: string,
  ) {
    return this.service.findByBusiness(businessId);
  }
}
