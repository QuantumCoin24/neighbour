export interface PermissionEntity {
  id: string;
  subjectId: string;
  resource: string;
  action: string;
  granted: boolean;
  createdAt: Date;
}
