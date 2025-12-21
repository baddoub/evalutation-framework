"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AuthLoggingInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthLoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
let AuthLoggingInterceptor = AuthLoggingInterceptor_1 = class AuthLoggingInterceptor {
    constructor() {
        this.logger = new common_1.Logger(AuthLoggingInterceptor_1.name);
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const { method, url, ip, headers } = request;
        const userAgent = headers['user-agent'] || 'unknown';
        const userId = request.user?.id || 'anonymous';
        const logData = {
            method,
            url,
            ip,
            userAgent,
            userId,
            timestamp: new Date().toISOString(),
        };
        return next.handle().pipe((0, operators_1.tap)(() => {
            if (url.includes('/auth/callback')) {
                this.logger.log({
                    ...logData,
                    event: 'authentication_success',
                    message: `User ${userId} authenticated successfully`,
                });
            }
            else if (url.includes('/auth/refresh')) {
                this.logger.log({
                    ...logData,
                    event: 'token_refresh_success',
                    message: `User ${userId} refreshed tokens`,
                });
            }
            else if (url.includes('/auth/logout')) {
                this.logger.log({
                    ...logData,
                    event: 'logout_success',
                    message: `User ${userId} logged out`,
                });
            }
        }), (0, operators_1.catchError)((error) => {
            if (url.includes('/auth/callback')) {
                this.logger.warn({
                    ...logData,
                    event: 'authentication_failure',
                    message: `Authentication failed: ${error.message}`,
                    error: error.name,
                });
            }
            else if (url.includes('/auth/refresh')) {
                this.logger.warn({
                    ...logData,
                    event: 'token_refresh_failure',
                    message: `Token refresh failed: ${error.message}`,
                    error: error.name,
                });
            }
            throw error;
        }));
    }
};
exports.AuthLoggingInterceptor = AuthLoggingInterceptor;
exports.AuthLoggingInterceptor = AuthLoggingInterceptor = AuthLoggingInterceptor_1 = __decorate([
    (0, common_1.Injectable)()
], AuthLoggingInterceptor);
//# sourceMappingURL=auth-logging.interceptor.js.map