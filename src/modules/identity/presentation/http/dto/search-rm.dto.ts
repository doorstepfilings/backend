import { IsNotEmpty, IsString } from 'class-validator';

export class SearchRmDto {
  @IsString()
  @IsNotEmpty()
  rm_unique_id!: string;
}
