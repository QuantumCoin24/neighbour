export interface EventEntity {
  id: string;

  communityId: string;
  creatorId: string;

  title: string;
  description: string;

  startsAt: Date;
  endsAt: Date;

  createdAt: Date;

  community?: {
    id: string;
    name: string;
  };

  creator?: {
    id: string;
    displayName: string;
  };

  attendanceCount?: number;
}
