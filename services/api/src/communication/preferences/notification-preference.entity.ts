export interface NotificationPreferenceEntity {
  id: string;
  userId: string;
  category: 'messages' | 'events' | 'community' | 'business';
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}
