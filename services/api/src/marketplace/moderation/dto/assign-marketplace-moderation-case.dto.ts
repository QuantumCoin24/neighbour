import { IsUUID } from 'class-validator';

export class AssignMarketplaceModerationCaseDto {
  @IsUUID('4')
  moderatorId!: string;
}
