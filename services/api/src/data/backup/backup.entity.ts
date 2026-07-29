export interface BackupEntity {
  id: string;
  source: string;
  status: 'created' | 'restored';
  createdAt: Date;
}
