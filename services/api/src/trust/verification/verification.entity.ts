export interface VerificationEntity {
  id: string;
  subjectId: string;
  subjectType: 'user' | 'business';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}
