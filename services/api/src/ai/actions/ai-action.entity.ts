export interface AIActionEntity {
  id: string;
  userId: string;
  action: 'create_event' | 'find_service' | 'join_community' | 'update_profile';
  status: 'suggested' | 'completed';
  createdAt: Date;
}
