export interface DeveloperAppEntity {
  id: string;
  ownerId: string;
  name: string;
  status:
    | 'active'
    | 'disabled';
  createdAt: Date;
}
