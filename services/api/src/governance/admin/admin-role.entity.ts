export interface AdminRoleEntity {
  id: string;
  name:
    | 'owner'
    | 'administrator'
    | 'moderator'
    | 'support';
  active: boolean;
  createdAt: Date;
}
