export interface ConsentEntity {
  id: string;
  userId: string;
  type: 'terms' | 'privacy' | 'marketing';
  accepted: boolean;
  createdAt: Date;
}
