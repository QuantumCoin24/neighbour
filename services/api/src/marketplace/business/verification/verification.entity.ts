export interface VerificationEntity {
  id: string;

  businessId: string;

  status: string;

  notes?: string | null;

  submittedAt: Date;

  reviewedAt?: Date | null;

  reviewerId?: string | null;
}

export interface VerificationQueueEntity extends VerificationEntity {
  business: {
    id: string;
    communityId: string;
    ownerId: string;
    name: string;
    description: string;
    category: string;
    verified: boolean;
  };
}
