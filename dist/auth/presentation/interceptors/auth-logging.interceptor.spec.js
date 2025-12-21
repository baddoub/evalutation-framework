"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const rxjs_1 = require("rxjs");
const auth_logging_interceptor_1 = require("./auth-logging.interceptor");
describe('AuthLoggingInterceptor', () => {
    let interceptor;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [auth_logging_interceptor_1.AuthLoggingInterceptor],
        }).compile();
        interceptor = module.get(auth_logging_interceptor_1.AuthLoggingInterceptor);
    });
    const createMockContext = (url, userId) => {
        return {
            switchToHttp: () => ({
                getRequest: () => ({
                    method: 'POST',
                    url,
                    ip: '127.0.0.1',
                    headers: {
                        'user-agent': 'test-agent',
                    },
                    user: userId ? { id: userId } : undefined,
                }),
            }),
        };
    };
    const createMockCallHandler = (result) => {
        return {
            handle: () => (0, rxjs_1.of)(result || {}),
        };
    };
    it('should log authentication success', (done) => {
        const context = createMockContext('/auth/callback', 'user-123');
        const handler = createMockCallHandler();
        const logSpy = jest.spyOn(interceptor['logger'], 'log');
        interceptor.intercept(context, handler).subscribe(() => {
            expect(logSpy).toHaveBeenCalledWith(expect.objectContaining({
                event: 'authentication_success',
                userId: 'user-123',
            }));
            done();
        });
    });
    it('should log token refresh success', (done) => {
        const context = createMockContext('/auth/refresh', 'user-123');
        const handler = createMockCallHandler();
        const logSpy = jest.spyOn(interceptor['logger'], 'log');
        interceptor.intercept(context, handler).subscribe(() => {
            expect(logSpy).toHaveBeenCalledWith(expect.objectContaining({
                event: 'token_refresh_success',
                userId: 'user-123',
            }));
            done();
        });
    });
    it('should log logout success', (done) => {
        const context = createMockContext('/auth/logout', 'user-123');
        const handler = createMockCallHandler();
        const logSpy = jest.spyOn(interceptor['logger'], 'log');
        interceptor.intercept(context, handler).subscribe(() => {
            expect(logSpy).toHaveBeenCalledWith(expect.objectContaining({
                event: 'logout_success',
                userId: 'user-123',
            }));
            done();
        });
    });
    it('should log authentication failure', (done) => {
        const context = createMockContext('/auth/callback');
        const handler = {
            handle: () => (0, rxjs_1.throwError)(() => new Error('Invalid credentials')),
        };
        const warnSpy = jest.spyOn(interceptor['logger'], 'warn');
        interceptor.intercept(context, handler).subscribe({
            error: () => {
                expect(warnSpy).toHaveBeenCalledWith(expect.objectContaining({
                    event: 'authentication_failure',
                    message: 'Authentication failed: Invalid credentials',
                }));
                done();
            },
        });
    });
});
//# sourceMappingURL=auth-logging.interceptor.spec.js.map