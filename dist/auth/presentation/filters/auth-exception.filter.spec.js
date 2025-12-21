"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const auth_exception_filter_1 = require("./auth-exception.filter");
const authentication_failed_exception_1 = require("../../application/exceptions/authentication-failed.exception");
const token_expired_exception_1 = require("../../application/exceptions/token-expired.exception");
const user_deactivated_exception_1 = require("../../application/exceptions/user-deactivated.exception");
describe('AuthExceptionFilter', () => {
    let filter;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [auth_exception_filter_1.AuthExceptionFilter],
        }).compile();
        filter = module.get(auth_exception_filter_1.AuthExceptionFilter);
    });
    const mockResponse = () => {
        const res = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res;
    };
    const mockArgumentsHost = (response) => {
        return {
            switchToHttp: () => ({
                getResponse: () => response,
                getRequest: () => ({
                    url: '/auth/callback',
                }),
            }),
        };
    };
    it('should map AuthenticationFailedException to 401', () => {
        const response = mockResponse();
        const host = mockArgumentsHost(response);
        const exception = new authentication_failed_exception_1.AuthenticationFailedException('Invalid credentials');
        filter.catch(exception, host);
        expect(response.status).toHaveBeenCalledWith(common_1.HttpStatus.UNAUTHORIZED);
        expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
            statusCode: common_1.HttpStatus.UNAUTHORIZED,
            message: 'Invalid credentials',
            error: 'Unauthorized',
        }));
    });
    it('should map TokenExpiredException to 401', () => {
        const response = mockResponse();
        const host = mockArgumentsHost(response);
        const exception = new token_expired_exception_1.TokenExpiredException('Token expired');
        filter.catch(exception, host);
        expect(response.status).toHaveBeenCalledWith(common_1.HttpStatus.UNAUTHORIZED);
        expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
            statusCode: common_1.HttpStatus.UNAUTHORIZED,
            message: 'Token has expired',
        }));
    });
    it('should map UserDeactivatedException to 403', () => {
        const response = mockResponse();
        const host = mockArgumentsHost(response);
        const exception = new user_deactivated_exception_1.UserDeactivatedException('User deactivated');
        filter.catch(exception, host);
        expect(response.status).toHaveBeenCalledWith(common_1.HttpStatus.FORBIDDEN);
        expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
            statusCode: common_1.HttpStatus.FORBIDDEN,
            message: 'User account is deactivated',
            error: 'Forbidden',
        }));
    });
    it('should include timestamp and path', () => {
        const response = mockResponse();
        const host = mockArgumentsHost(response);
        const exception = new authentication_failed_exception_1.AuthenticationFailedException('Test');
        filter.catch(exception, host);
        expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
            timestamp: expect.any(String),
            path: '/auth/callback',
        }));
    });
});
//# sourceMappingURL=auth-exception.filter.spec.js.map