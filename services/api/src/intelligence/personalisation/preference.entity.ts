export interface PreferenceEntity {
  id: string;
  userId: string;
  category: string;
  value: string;
  createdAt: Date;
}
