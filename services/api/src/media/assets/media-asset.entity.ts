export interface MediaAssetEntity {
  id: string;
  ownerId: string;
  ownerType: 'profile' | 'community' | 'event' | 'business' | 'post';
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: Date;
}
