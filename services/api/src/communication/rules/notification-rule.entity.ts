export interface NotificationRuleEntity {
  id: string;
  trigger: string;
  category: string;
  priority: 'low' | 'normal' | 'high';
  createdAt: Date;
}
