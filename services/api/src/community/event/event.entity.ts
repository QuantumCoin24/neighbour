export interface EventEntity {
  id: string;
  communityId: string;
  creatorId: string;
  title: string;
  description: string;
  startsAt: Date;
  endsAt: Date;
  createdAt: Date;
}
