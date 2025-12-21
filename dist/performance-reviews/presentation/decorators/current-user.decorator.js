"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentUser = void 0;
const common_1 = require("@nestjs/common");
exports.CurrentUser = (0, common_1.createParamDecorator)((_data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return {
        userId: request.user.id,
        email: request.user.email,
        name: request.user.name,
        role: request.user.role,
        level: request.user.level,
        department: request.user.department,
        managerId: request.user.managerId,
    };
});
//# sourceMappingURL=current-user.decorator.js.map