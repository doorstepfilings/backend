import {
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString,
} from 'class-validator';
import { IsStrongPassword } from '../../../../../shared/validators/password.validator';

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
    @IsStrongPassword()
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
