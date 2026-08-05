import { IsEnum } from 'class-validator';

export enum ActivatableSubscriptionPlan {
  FREE = 'FREE',
  PLUS = 'PLUS',
  BUSINESS = 'BUSINESS',
}

export class ActivateSubscriptionDto {
  @IsEnum(ActivatableSubscriptionPlan)
  plan: ActivatableSubscriptionPlan;
}
