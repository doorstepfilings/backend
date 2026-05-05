"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.successResponse = successResponse;
function successResponse(data, message = 'Success') {
    return {
        success: true,
        message,
        data,
    };
}
//# sourceMappingURL=api-response.js.map