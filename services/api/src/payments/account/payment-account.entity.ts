export interface PaymentAccountEntity {
  id: string;
  ownerId: string;
  ownerType: 'user' | 'business' | 'community';
  status: 'active' | 'suspended';
  createdAt: Date;
}
