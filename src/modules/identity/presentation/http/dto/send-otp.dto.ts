import { IsOptional, IsString } from 'class-validator';

export class SendOtpDto {
  @IsOptional()
  @IsString()
  identifier?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  value?: string;
}
