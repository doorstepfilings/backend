import { IsNotEmpty, IsString } from 'class-validator';

export class SendLoginOtpDto {
  @IsString()
  @IsNotEmpty()
  mobile_number!: string;
}
