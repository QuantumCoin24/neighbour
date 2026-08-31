import type {
  VerificationEntity,
  VerificationQueueEntity,
} from './verification.entity';

export abstract class VerificationRepository {
  abstract save(verification: VerificationEntity): Promise<VerificationEntity>;

  abstract findByBusiness(businessId: string): Promise<VerificationEntity | undefined>;
  abstract findMany(status?: string): Promise<VerificationQueueEntity[]>;
}
