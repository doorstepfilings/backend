import {
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString,
    MinLength,
} from 'class-validator';

export class RegisterDto {
    @IsNotEmpty()
    @IsString()
    name!: string;

    @IsEmail()
    @IsNotEmpty()
    email!: string;

    @IsNotEmpty()
    @IsString()
    mobile_number!: string;

    @IsNotEmpty()
    @MinLength(6)
    password!: string;

    @IsOptional()
    @IsString()
    referral_code?: string;

    @IsOptional()
    @IsString()
    rm_id?: string;

    @IsString()
    @IsOptional()
    role?: string;
}
