import { plainToInstance } from 'class-transformer';
import {
    IsIn,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUrl,
    Max,
    Min,
    validateSync,
} from 'class-validator';

class EnvironmentVariables {
    @IsIn(['development', 'test', 'production'])
    NODE_ENV!: string;

    @IsString()
    @IsNotEmpty()
    APP_NAME!: string;

    @IsNumber()
    @Min(1)
    @Max(65535)
    PORT!: number;

    @IsString()
    @IsNotEmpty()
    API_PREFIX!: string;

    @IsUrl({
        require_tld: false,
        require_protocol: true,
    })
    FRONTEND_URL!: string;

    @IsString()
    @IsNotEmpty()
    DB_HOST!: string;

    @IsNumber()
    @Min(1)
    @Max(65535)
    DB_PORT!: number;

    @IsString()
    @IsNotEmpty()
    DB_DATABASE!: string;

    @IsString()
    @IsNotEmpty()
    DB_USERNAME!: string;

    @IsString()
    @IsOptional()
    DB_PASSWORD!: string;

    @IsString()
    @IsNotEmpty()
    JWT_SECRET!: string;

    @IsString()
    @IsNotEmpty()
    JWT_EXPIRES_IN!: string;

    @IsString()
    @IsNotEmpty()
    MAIL_HOST!: string;

    @IsNumber()
    MAIL_PORT!: number;

    @IsString()
    @IsNotEmpty()
    MAIL_USER!: string;

    @IsString()
    @IsNotEmpty()
    MAIL_PASS!: string;

    @IsString()
    @IsNotEmpty()
    MAIL_FROM!: string;

    @IsString()
    @IsNotEmpty()
    RAZORPAY_KEY_ID!: string;

    @IsString()
    @IsNotEmpty()
    RAZORPAY_KEY_SECRET!: string;
}


export function validateEnvironment(config: Record<string, unknown>) {
    const mergedConfig = {
        API_PREFIX: 'api',
        APP_NAME: 'doorstep-backend',
        FRONTEND_URL: 'http://127.0.0.1:3000',
        NODE_ENV: 'development',
        PORT: 4000,
        DB_HOST: '127.0.0.1',
        DB_PORT: 3306,
        DB_DATABASE: 'Accounting',
        DB_USERNAME: 'root',
        DB_PASSWORD: '',
        JWT_SECRET: 'change-me-before-production',
        JWT_EXPIRES_IN: '30d',
        MAIL_HOST: 'smtp.gmail.com',
        MAIL_PORT: 587,
        MAIL_USER: '',
        MAIL_PASS: '',
        MAIL_FROM: '',
        RAZORPAY_KEY_ID: '',
        RAZORPAY_KEY_SECRET: '',
        ...config,
    };

    const validatedConfig = plainToInstance(
        EnvironmentVariables,
        mergedConfig,
        {
            enableImplicitConversion: true,
        },
    );
    const errors = validateSync(validatedConfig, {
        skipMissingProperties: false,
    });

    if (errors.length > 0) {
        throw new Error(errors.toString());
    }

    return validatedConfig;
}
