import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export enum MarketplaceModerationSubjectTypeDto {
  LISTING = 'LISTING',
  USER = 'USER',
  TRANSACTION = 'TRANSACTION',
  PAYMENT = 'PAYMENT',
  FULFILMENT = 'FULFILMENT',
  REVIEW = 'REVIEW',
  DISPUTE = 'DISPUTE',
  MESSAGE = 'MESSAGE',
}

export enum MarketplaceModerationReasonDto {
  FRAUD_SUSPECTED = 'FRAUD_SUSPECTED',
  PROHIBITED_ITEM = 'PROHIBITED_ITEM',
  MISLEADING_LISTING = 'MISLEADING_LISTING',
  COUNTERFEIT_ITEM = 'COUNTERFEIT_ITEM',
  PAYMENT_ABUSE = 'PAYMENT_ABUSE',
  HARASSMENT = 'HARASSMENT',
  THREAT_OR_SAFETY = 'THREAT_OR_SAFETY',
  SPAM = 'SPAM',
  REVIEW_ABUSE = 'REVIEW_ABUSE',
  REPEAT_CANCELLATION = 'REPEAT_CANCELLATION',
  DISPUTE_ABUSE = 'DISPUTE_ABUSE',
  IDENTITY_RISK = 'IDENTITY_RISK',
  OTHER = 'OTHER',
}

export class CreateMarketplaceModerationCaseDto {
  @IsEnum(MarketplaceModerationSubjectTypeDto)
  subjectType!: MarketplaceModerationSubjectTypeDto;

  @IsUUID('4')
  subjectId!: string;

  @IsEnum(MarketplaceModerationReasonDto)
  reason!: MarketplaceModerationReasonDto;

  @IsString()
  @MaxLength(160)
  title!: string;

  @IsString()
  @MaxLength(5_000)
  description!: string;

  @IsOptional()
  @IsUUID('4')
  reportedUserId?: string;
}
