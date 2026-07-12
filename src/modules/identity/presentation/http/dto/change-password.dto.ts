import { IsNotEmpty, IsString } from 'class-validator';
import { IsStrongPassword } from '../../../../../shared/validators/password.validator';

export class ChangePasswordDto {
    @IsString()
    @IsNotEmpty()
    current_password!: string;

    @IsString()
    @IsStrongPassword()
    new_password!: string;

    @IsString()
    @IsStrongPassword()
    new_password_confirmation!: string;
}
