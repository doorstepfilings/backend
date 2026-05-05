"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
let ApiExceptionFilter = class ApiExceptionFilter {
    catch(exception, host) {
        const context = host.switchToHttp();
        const response = context.getResponse();
        const status = exception instanceof common_1.HttpException
            ? exception.getStatus()
            : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        if (status === common_1.HttpStatus.INTERNAL_SERVER_ERROR) {
            console.error('[API Error]', exception);
        }
        const exceptionResponse = exception instanceof common_1.HttpException ? exception.getResponse() : null;
        let message = 'Internal server error';
        let errors = null;
        if (exception instanceof common_1.BadRequestException &&
            typeof exceptionResponse === 'object') {
            const payload = exceptionResponse;
            message = Array.isArray(payload.message)
                ? 'Validation failed'
                : (payload.message ?? 'Validation failed');
            errors = payload.message ?? null;
        }
        else if (typeof exceptionResponse === 'string') {
            message = exceptionResponse;
        }
        else if (exceptionResponse &&
            typeof exceptionResponse === 'object' &&
            'message' in exceptionResponse) {
            const payload = exceptionResponse;
            message = Array.isArray(payload.message)
                ? (payload.error ?? 'Request failed')
                : (payload.message ?? payload.error ?? 'Request failed');
            errors = Array.isArray(payload.message) ? payload.message : null;
        }
        else if (exception instanceof Error) {
            message = exception.message;
        }
        response.status(status).json({
            success: false,
            ...(errors ? { errors } : {}),
            message,
        });
    }
};
exports.ApiExceptionFilter = ApiExceptionFilter;
exports.ApiExceptionFilter = ApiExceptionFilter = __decorate([
    (0, common_1.Catch)()
], ApiExceptionFilter);
//# sourceMappingURL=api-exception.filter.js.map