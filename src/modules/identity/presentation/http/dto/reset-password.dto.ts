import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { IsStrongPassword } from '../../../../../shared/validators/password.validator';

export class ResetPasswordDto {
    @IsString()
    @IsNotEmpty()
    token!: string;

    @IsEmail()
    @IsNotEmpty()
    email!: string;

    @IsString()
    @IsStrongPassword()
    password!: string;

    @IsString()
    @IsStrongPassword()
    password_confirmation!: string;
}
