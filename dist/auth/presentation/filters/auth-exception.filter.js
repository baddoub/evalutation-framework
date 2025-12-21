"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const authentication_failed_exception_1 = require("../../application/exceptions/authentication-failed.exception");
const token_expired_exception_1 = require("../../application/exceptions/token-expired.exception");
const user_not_found_exception_1 = require("../../application/exceptions/user-not-found.exception");
const user_deactivated_exception_1 = require("../../application/exceptions/user-deactivated.exception");
const token_theft_detected_exception_1 = require("../../application/exceptions/token-theft-detected.exception");
const keycloak_integration_exception_1 = require("../../infrastructure/exceptions/keycloak-integration.exception");
const invalid_token_exception_1 = require("../../infrastructure/exceptions/invalid-token.exception");
let AuthExceptionFilter = class AuthExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let error = 'Internal Server Error';
        if (exception instanceof authentication_failed_exception_1.AuthenticationFailedException) {
            status = common_1.HttpStatus.UNAUTHORIZED;
            message = exception.message;
            error = 'Unauthorized';
        }
        else if (exception instanceof token_expired_exception_1.TokenExpiredException) {
            status = common_1.HttpStatus.UNAUTHORIZED;
            message = 'Token has expired';
            error = 'Unauthorized';
        }
        else if (exception instanceof invalid_token_exception_1.InvalidTokenException) {
            status = common_1.HttpStatus.UNAUTHORIZED;
            message = 'Invalid token';
            error = 'Unauthorized';
        }
        else if (exception instanceof user_not_found_exception_1.UserNotFoundException) {
            status = common_1.HttpStatus.UNAUTHORIZED;
            message = 'User not found';
            error = 'Unauthorized';
        }
        else if (exception instanceof user_deactivated_exception_1.UserDeactivatedException) {
            status = common_1.HttpStatus.FORBIDDEN;
            message = 'User account is deactivated';
            error = 'Forbidden';
        }
        else if (exception instanceof token_theft_detected_exception_1.TokenTheftDetectedException) {
            status = common_1.HttpStatus.UNAUTHORIZED;
            message = 'Token reuse detected - all sessions revoked';
            error = 'Unauthorized';
        }
        else if (exception instanceof keycloak_integration_exception_1.KeycloakIntegrationException) {
            status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            message =
                'Authentication service is temporarily unavailable. Please try again in a few moments.';
            error = 'Internal Server Error';
        }
        else if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            }
            else if (typeof exceptionResponse === 'object') {
                message = exceptionResponse.message || exception.message;
                error = exceptionResponse.error || error;
            }
        }
        response.status(status).json({
            statusCode: status,
            message,
            error,
            timestamp: new Date().toISOString(),
            path: request.url,
        });
    }
};
exports.AuthExceptionFilter = AuthExceptionFilter;
exports.AuthExceptionFilter = AuthExceptionFilter = __decorate([
    (0, common_1.Catch)()
], AuthExceptionFilter);
//# sourceMappingURL=auth-exception.filter.js.map