export interface DataRecordEntity {
  id: string;
  ownerId: string;
  category: 'profile' | 'community' | 'media' | 'transaction';
  referenceId: string;
  createdAt: Date;
}
