import { IsNotEmpty, IsString, Length } from 'class-validator';

export class LoginWithMobileDto {
  @IsString()
  @IsNotEmpty()
  mobile_number!: string;

  @IsString()
  @Length(6, 6)
  otp!: string;
}
