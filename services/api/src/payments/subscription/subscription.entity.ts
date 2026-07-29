export interface SubscriptionEntity {
  id: string;
  ownerId: string;
  plan: 'free' | 'plus' | 'business';
  status: 'active' | 'cancelled';
  createdAt: Date;
}
