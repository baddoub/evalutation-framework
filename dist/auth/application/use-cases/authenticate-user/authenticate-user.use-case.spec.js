"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const authenticate_user_use_case_1 = require("./authenticate-user.use-case");
const user_entity_1 = require("../../../domain/entities/user.entity");
const user_id_vo_1 = require("../../../domain/value-objects/user-id.vo");
const email_vo_1 = require("../../../domain/value-objects/email.vo");
const role_vo_1 = require("../../../domain/value-objects/role.vo");
const session_entity_1 = require("../../../domain/entities/session.entity");
const authentication_failed_exception_1 = require("../../exceptions/authentication-failed.exception");
const user_deactivated_exception_1 = require("../../exceptions/user-deactivated.exception");
describe('AuthenticateUserUseCase', () => {
    let useCase;
    let keycloakAdapter;
    let tokenService;
    let sessionManager;
    let userRepository;
    let refreshTokenRepository;
    const mockKeycloakTokens = {
        accessToken: 'keycloak_access_token',
        refreshToken: 'keycloak_refresh_token',
        expiresIn: 3600,
        tokenType: 'Bearer',
    };
    const mockKeycloakUserInfo = {
        sub: 'keycloak-user-id-123',
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: true,
    };
    const mockTokenPair = {
        accessToken: 'app_access_token',
        refreshToken: 'app_refresh_token',
        expiresIn: 900,
    };
    const mockUser = user_entity_1.User.create({
        id: user_id_vo_1.UserId.generate(),
        email: email_vo_1.Email.create('test@example.com'),
        name: 'Test User',
        keycloakId: 'keycloak-user-id-123',
        roles: [role_vo_1.Role.user()],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    });
    const mockSession = session_entity_1.Session.create({
        id: 'session-123',
        userId: mockUser.id,
        deviceId: 'device-123',
        userAgent: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        lastUsed: new Date(),
    });
    beforeEach(async () => {
        const mockKeycloakAdapter = {
            exchangeCodeForTokens: jest.fn(),
            validateToken: jest.fn(),
            refreshTokens: jest.fn(),
            revokeToken: jest.fn(),
            getUserInfo: jest.fn(),
        };
        const mockTokenService = {
            generateTokenPair: jest.fn(),
            validateAccessToken: jest.fn(),
            validateRefreshToken: jest.fn(),
            decodeToken: jest.fn(),
            revokeToken: jest.fn(),
        };
        const mockSessionManager = {
            createSession: jest.fn(),
            findByRefreshToken: jest.fn(),
            markTokenAsUsed: jest.fn(),
            updateSession: jest.fn(),
            revokeAllUserSessions: jest.fn(),
            findActiveSessions: jest.fn(),
        };
        const mockUserRepository = {
            findById: jest.fn(),
            findByEmail: jest.fn(),
            findByKeycloakId: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            existsByEmail: jest.fn(),
            findByRole: jest.fn(),
            findByManagerId: jest.fn(),
        };
        const mockRefreshTokenRepository = {
            findById: jest.fn(),
            findByUserId: jest.fn(),
            findByTokenHash: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            markAsUsed: jest.fn(),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                authenticate_user_use_case_1.AuthenticateUserUseCase,
                { provide: 'IKeycloakAdapter', useValue: mockKeycloakAdapter },
                { provide: 'ITokenService', useValue: mockTokenService },
                { provide: 'ISessionManager', useValue: mockSessionManager },
                { provide: 'IUserRepository', useValue: mockUserRepository },
                { provide: 'IRefreshTokenRepository', useValue: mockRefreshTokenRepository },
            ],
        }).compile();
        useCase = module.get(authenticate_user_use_case_1.AuthenticateUserUseCase);
        keycloakAdapter = module.get('IKeycloakAdapter');
        tokenService = module.get('ITokenService');
        sessionManager = module.get('ISessionManager');
        userRepository = module.get('IUserRepository');
        refreshTokenRepository = module.get('IRefreshTokenRepository');
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('execute', () => {
        const input = {
            authorizationCode: 'auth_code_123',
            codeVerifier: 'code_verifier_xyz',
            deviceId: 'device-123',
            userAgent: 'Mozilla/5.0',
            ipAddress: '192.168.1.1',
        };
        it('should exchange authorization code for Keycloak tokens', async () => {
            keycloakAdapter.exchangeCodeForTokens.mockResolvedValue(mockKeycloakTokens);
            keycloakAdapter.validateToken.mockResolvedValue(mockKeycloakUserInfo);
            userRepository.findByKeycloakId.mockResolvedValue(mockUser);
            tokenService.generateTokenPair.mockResolvedValue(mockTokenPair);
            refreshTokenRepository.save.mockResolvedValue(undefined);
            sessionManager.createSession.mockResolvedValue(mockSession);
            await useCase.execute(input);
            expect(keycloakAdapter.exchangeCodeForTokens).toHaveBeenCalledWith(input.authorizationCode, input.codeVerifier);
        });
        it('should validate Keycloak token and extract user info', async () => {
            keycloakAdapter.exchangeCodeForTokens.mockResolvedValue(mockKeycloakTokens);
            keycloakAdapter.validateToken.mockResolvedValue(mockKeycloakUserInfo);
            userRepository.findByKeycloakId.mockResolvedValue(mockUser);
            tokenService.generateTokenPair.mockResolvedValue(mockTokenPair);
            refreshTokenRepository.save.mockResolvedValue(undefined);
            sessionManager.createSession.mockResolvedValue(mockSession);
            await useCase.execute(input);
            expect(keycloakAdapter.validateToken).toHaveBeenCalledWith(mockKeycloakTokens.accessToken);
        });
        it('should create new user if not found in database', async () => {
            keycloakAdapter.exchangeCodeForTokens.mockResolvedValue(mockKeycloakTokens);
            keycloakAdapter.validateToken.mockResolvedValue(mockKeycloakUserInfo);
            userRepository.findByKeycloakId.mockResolvedValue(null);
            userRepository.save.mockResolvedValue(mockUser);
            tokenService.generateTokenPair.mockResolvedValue(mockTokenPair);
            refreshTokenRepository.save.mockResolvedValue(undefined);
            sessionManager.createSession.mockResolvedValue(mockSession);
            const result = await useCase.execute(input);
            expect(userRepository.save).toHaveBeenCalled();
            expect(result.user.email).toBe(mockKeycloakUserInfo.email);
            expect(result.user.name).toBe(mockKeycloakUserInfo.name);
        });
        it('should update existing user with Keycloak data', async () => {
            const existingUser = user_entity_1.User.create({
                id: user_id_vo_1.UserId.generate(),
                email: email_vo_1.Email.create('test@example.com'),
                name: 'Old Name',
                keycloakId: 'keycloak-user-id-123',
                roles: [role_vo_1.Role.user()],
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            keycloakAdapter.exchangeCodeForTokens.mockResolvedValue(mockKeycloakTokens);
            keycloakAdapter.validateToken.mockResolvedValue(mockKeycloakUserInfo);
            userRepository.findByKeycloakId.mockResolvedValue(existingUser);
            userRepository.save.mockResolvedValue(existingUser);
            tokenService.generateTokenPair.mockResolvedValue(mockTokenPair);
            refreshTokenRepository.save.mockResolvedValue(undefined);
            sessionManager.createSession.mockResolvedValue(mockSession);
            await useCase.execute(input);
            expect(userRepository.save).toHaveBeenCalled();
        });
        it('should throw error if user is deactivated', async () => {
            const deactivatedUser = user_entity_1.User.create({
                id: user_id_vo_1.UserId.generate(),
                email: email_vo_1.Email.create('test@example.com'),
                name: 'Test User',
                keycloakId: 'keycloak-user-id-123',
                roles: [role_vo_1.Role.user()],
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            deactivatedUser.deactivate();
            keycloakAdapter.exchangeCodeForTokens.mockResolvedValue(mockKeycloakTokens);
            keycloakAdapter.validateToken.mockResolvedValue(mockKeycloakUserInfo);
            userRepository.findByKeycloakId.mockResolvedValue(deactivatedUser);
            await expect(useCase.execute(input)).rejects.toThrow(user_deactivated_exception_1.UserDeactivatedException);
        });
        it('should generate application tokens', async () => {
            keycloakAdapter.exchangeCodeForTokens.mockResolvedValue(mockKeycloakTokens);
            keycloakAdapter.validateToken.mockResolvedValue(mockKeycloakUserInfo);
            userRepository.findByKeycloakId.mockResolvedValue(mockUser);
            tokenService.generateTokenPair.mockResolvedValue(mockTokenPair);
            refreshTokenRepository.save.mockResolvedValue(undefined);
            sessionManager.createSession.mockResolvedValue(mockSession);
            await useCase.execute(input);
            expect(tokenService.generateTokenPair).toHaveBeenCalledWith(mockUser.id, mockUser.roles);
        });
        it('should create session record', async () => {
            keycloakAdapter.exchangeCodeForTokens.mockResolvedValue(mockKeycloakTokens);
            keycloakAdapter.validateToken.mockResolvedValue(mockKeycloakUserInfo);
            userRepository.findByKeycloakId.mockResolvedValue(mockUser);
            tokenService.generateTokenPair.mockResolvedValue(mockTokenPair);
            refreshTokenRepository.save.mockResolvedValue(undefined);
            sessionManager.createSession.mockResolvedValue(mockSession);
            await useCase.execute(input);
            expect(sessionManager.createSession).toHaveBeenCalledWith(expect.objectContaining({
                userId: mockUser.id,
                deviceId: input.deviceId,
                userAgent: input.userAgent,
                ipAddress: input.ipAddress,
            }));
        });
        it('should return authentication result with tokens and user', async () => {
            keycloakAdapter.exchangeCodeForTokens.mockResolvedValue(mockKeycloakTokens);
            keycloakAdapter.validateToken.mockResolvedValue(mockKeycloakUserInfo);
            userRepository.findByKeycloakId.mockResolvedValue(mockUser);
            tokenService.generateTokenPair.mockResolvedValue(mockTokenPair);
            refreshTokenRepository.save.mockResolvedValue(undefined);
            sessionManager.createSession.mockResolvedValue(mockSession);
            const result = await useCase.execute(input);
            expect(result).toEqual({
                user: expect.objectContaining({
                    email: mockUser.email.value,
                    name: mockUser.name,
                }),
                accessToken: mockTokenPair.accessToken,
                refreshToken: mockTokenPair.refreshToken,
                expiresIn: mockTokenPair.expiresIn,
            });
        });
        it('should handle Keycloak errors gracefully', async () => {
            keycloakAdapter.exchangeCodeForTokens.mockRejectedValue(new Error('Keycloak connection failed'));
            await expect(useCase.execute(input)).rejects.toThrow(authentication_failed_exception_1.AuthenticationFailedException);
        });
        it('should throw AuthenticationFailedException for invalid authorization code', async () => {
            keycloakAdapter.exchangeCodeForTokens.mockRejectedValue(new Error('Invalid authorization code'));
            await expect(useCase.execute(input)).rejects.toThrow(authentication_failed_exception_1.AuthenticationFailedException);
        });
    });
});
//# sourceMappingURL=authenticate-user.use-case.spec.js.map