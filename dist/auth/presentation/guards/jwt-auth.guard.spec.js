"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const jwt_auth_guard_1 = require("./jwt-auth.guard");
const user_entity_1 = require("../../domain/entities/user.entity");
const user_id_vo_1 = require("../../domain/value-objects/user-id.vo");
const email_vo_1 = require("../../domain/value-objects/email.vo");
const role_vo_1 = require("../../domain/value-objects/role.vo");
describe('JwtAuthGuard', () => {
    let guard;
    let tokenService;
    let userRepository;
    let reflector;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                jwt_auth_guard_1.JwtAuthGuard,
                {
                    provide: 'ITokenService',
                    useValue: {
                        validateAccessToken: jest.fn(),
                    },
                },
                {
                    provide: 'IUserRepository',
                    useValue: {
                        findById: jest.fn(),
                    },
                },
                core_1.Reflector,
            ],
        }).compile();
        guard = module.get(jwt_auth_guard_1.JwtAuthGuard);
        tokenService = module.get('ITokenService');
        userRepository = module.get('IUserRepository');
        reflector = module.get(core_1.Reflector);
    });
    const createMockExecutionContext = (headers = {}, isPublic = false) => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(isPublic);
        return {
            switchToHttp: () => ({
                getRequest: () => ({
                    headers,
                    user: undefined,
                }),
            }),
            getHandler: jest.fn(),
            getClass: jest.fn(),
        };
    };
    it('should allow access with valid token', async () => {
        const userId = user_id_vo_1.UserId.generate();
        const user = user_entity_1.User.create({
            id: userId,
            email: email_vo_1.Email.create('test@example.com'),
            name: 'Test User',
            keycloakId: 'keycloak-123',
            roles: [role_vo_1.Role.user()],
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        const context = createMockExecutionContext({
            authorization: 'Bearer valid-token',
        });
        tokenService.validateAccessToken.mockResolvedValue({
            sub: userId.value,
            email: 'test@example.com',
            roles: ['user'],
        });
        userRepository.findById.mockResolvedValue(user);
        const result = await guard.canActivate(context);
        expect(result).toBe(true);
        expect(tokenService.validateAccessToken).toHaveBeenCalledWith('valid-token');
        expect(userRepository.findById).toHaveBeenCalled();
    });
    it('should deny access without token', async () => {
        const context = createMockExecutionContext({});
        await expect(guard.canActivate(context)).rejects.toThrow(common_1.UnauthorizedException);
    });
    it('should deny access with invalid token', async () => {
        const context = createMockExecutionContext({
            authorization: 'Bearer invalid-token',
        });
        tokenService.validateAccessToken.mockRejectedValue(new Error('Invalid token'));
        await expect(guard.canActivate(context)).rejects.toThrow(common_1.UnauthorizedException);
    });
    it('should deny access for deactivated user', async () => {
        const userId = user_id_vo_1.UserId.generate();
        const user = user_entity_1.User.create({
            id: userId,
            email: email_vo_1.Email.create('test@example.com'),
            name: 'Test User',
            keycloakId: 'keycloak-123',
            roles: [role_vo_1.Role.user()],
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        user.deactivate();
        const context = createMockExecutionContext({
            authorization: 'Bearer valid-token',
        });
        tokenService.validateAccessToken.mockResolvedValue({
            sub: userId.value,
            email: 'test@example.com',
            roles: ['user'],
        });
        userRepository.findById.mockResolvedValue(user);
        await expect(guard.canActivate(context)).rejects.toThrow(common_1.UnauthorizedException);
    });
    it('should allow public endpoints without token', async () => {
        const context = createMockExecutionContext({}, true);
        const result = await guard.canActivate(context);
        expect(result).toBe(true);
        expect(tokenService.validateAccessToken).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=jwt-auth.guard.spec.js.map