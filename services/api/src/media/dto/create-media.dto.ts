export class CreateMediaDto {
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  ownerType: 'profile' | 'community' | 'event' | 'business' | 'post';
}
