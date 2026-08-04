export type ActivityType = 'POST' | 'EVENT';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  createdAt: Date;
  data: unknown;
}

export interface ActivityFeedResponse {
  items: ActivityItem[];
}
