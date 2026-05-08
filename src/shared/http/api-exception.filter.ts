import {
    ArgumentsHost,
    BadRequestException,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
    constructor(private readonly configService: ConfigService) {}

    catch(exception: unknown, host: ArgumentsHost) {
        const context = host.switchToHttp();
        const response = context.getResponse<Response>();
        const isProduction = this.configService.get('app.nodeEnv') === 'production';

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
            console.error('[API Error]', exception);
        }

        const exceptionResponse =
            exception instanceof HttpException ? exception.getResponse() : null;

        let message = 'Internal server error';
        let errors: unknown = null;

        if (
            exception instanceof BadRequestException &&
            typeof exceptionResponse === 'object'
        ) {
            const payload = exceptionResponse as {
                message?: string | string[];
            };
            message = Array.isArray(payload.message)
                ? 'Validation failed'
                : (payload.message ?? 'Validation failed');
            errors = payload.message ?? null;
        } else if (typeof exceptionResponse === 'string') {
            message = exceptionResponse;
        } else if (
            exceptionResponse &&
            typeof exceptionResponse === 'object' &&
            'message' in exceptionResponse
        ) {
            const payload = exceptionResponse as {
                error?: string;
                message?: string | string[];
            };
            message = Array.isArray(payload.message)
                ? (payload.error ?? 'Request failed')
                : (payload.message ?? payload.error ?? 'Request failed');
            errors = Array.isArray(payload.message) ? payload.message : null;
        } else if (exception instanceof Error) {
            // In production, we don't want to leak internal error messages for 500s.
            if (status === HttpStatus.INTERNAL_SERVER_ERROR && isProduction) {
                message = 'An unexpected error occurred. Please try again later.';
            } else {
                message = exception.message;
            }
        }

        response.status(status).json({
            success: false,
            ...(errors ? { errors } : {}),
            message,
        });
    }
}
