import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class OauthLoginDto {
  @IsIn(['google'])
  provider!: 'google';

  @IsEmail()
  email!: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsNotEmpty()
  provider_account_id!: string;

  @IsString()
  @IsOptional()
  image?: string;
}
