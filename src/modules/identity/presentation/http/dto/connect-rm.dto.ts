import { IsNotEmpty, IsString } from 'class-validator';

export class ConnectRmDto {
  @IsString()
  @IsNotEmpty()
  rm_unique_id!: string;
}
