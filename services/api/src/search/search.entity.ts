export interface SearchEntity {
  id: string;
  query: string;
  category: 'user' | 'community' | 'business' | 'event' | 'service';
  targetId: string;
  createdAt: Date;
}
