import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';

export class OauthLoginDto {
  @IsIn(['google', 'github'])
  provider!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  provider_account_id?: string;

  @IsString()
  @IsOptional()
  image?: string;
}
