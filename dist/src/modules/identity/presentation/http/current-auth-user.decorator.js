"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentAuthUser = void 0;
const common_1 = require("@nestjs/common");
exports.CurrentAuthUser = (0, common_1.createParamDecorator)((_data, ctx) => {
    const request = ctx
        .switchToHttp()
        .getRequest();
    return request.user;
});
//# sourceMappingURL=current-auth-user.decorator.js.map