import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class CompleteUploadDto {
  @IsOptional()
  @IsString()
  @Length(32, 128)
  checksum?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20000)
  width?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20000)
  height?: number;
}
