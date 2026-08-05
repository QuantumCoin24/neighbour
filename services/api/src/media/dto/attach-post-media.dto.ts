import { ArrayMaxSize, IsArray, IsUUID } from 'class-validator';

export class AttachPostMediaDto {
  @IsArray()
  @ArrayMaxSize(10)
  @IsUUID('4', {
    each: true,
  })
  mediaIds!: string[];
}
