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
        NODE_ENV: 'development',
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
