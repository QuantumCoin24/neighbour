import { IsDateString, IsString, Length, MaxLength } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @Length(3, 120)
  title!: string;

  @IsString()
  @MaxLength(5000)
  description!: string;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;
}
