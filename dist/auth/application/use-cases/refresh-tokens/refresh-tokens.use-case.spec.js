"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const realBcrypt = jest.requireActual('bcrypt');
jest.mock('bcrypt', () => ({
    ...realBcrypt,
    compare: jest.fn().mockResolvedValue(true),
}));
const testing_1 = require("@nestjs/testing");
const refresh_tokens_use_case_1 = require("./refresh-tokens.use-case");
const user_entity_1 = require("../../../domain/entities/user.entity");
const user_id_vo_1 = require("../../../domain/value-objects/user-id.vo");
const email_vo_1 = require("../../../domain/value-objects/email.vo");
const role_vo_1 = require("../../../domain/value-objects/role.vo");
const refresh_token_entity_1 = require("../../../domain/entities/refresh-token.entity");
const token_expired_exception_1 = require("../../exceptions/token-expired.exception");
const token_theft_detected_exception_1 = require("../../exceptions/token-theft-detected.exception");
const user_deactivated_exception_1 = require("../../exceptions/user-deactivated.exception");
const MOCK_REFRESH_TOKEN_HASH = realBcrypt.hashSync('mock_refresh_token', 10);
describe('RefreshTokensUseCase', () => {
    let useCase;
    let tokenService;
    let sessionManager;
    let userRepository;
    let refreshTokenRepository;
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
    const mockTokenPayload = {
        sub: mockUser.id.value,
        email: mockUser.email.value,
        roles: ['user'],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
        jti: 'token-id-123',
    };
    const mockNewTokenPair = {
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
        expiresIn: 900,
    };
    const mockRefreshToken = refresh_token_entity_1.RefreshToken.create({
        id: 'refresh-token-id',
        userId: mockUser.id,
        tokenHash: MOCK_REFRESH_TOKEN_HASH,
        used: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
    });
    beforeEach(async () => {
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
            findByTokenHash: jest.fn(),
            findByUserId: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            deleteAllByUserId: jest.fn(),
            deleteExpiredAndRevoked: jest.fn(),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                refresh_tokens_use_case_1.RefreshTokensUseCase,
                { provide: 'ITokenService', useValue: mockTokenService },
                { provide: 'ISessionManager', useValue: mockSessionManager },
                { provide: 'IUserRepository', useValue: mockUserRepository },
                {
                    provide: 'IRefreshTokenRepository',
                    useValue: mockRefreshTokenRepository,
                },
            ],
        }).compile();
        useCase = module.get(refresh_tokens_use_case_1.RefreshTokensUseCase);
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
            refreshToken: 'refresh_token_value',
        };
        it('should validate refresh token', async () => {
            tokenService.validateRefreshToken.mockResolvedValue(mockTokenPayload);
            userRepository.findById.mockResolvedValue(mockUser);
            refreshTokenRepository.findByUserId.mockResolvedValue([mockRefreshToken]);
            tokenService.generateTokenPair.mockResolvedValue(mockNewTokenPair);
            refreshTokenRepository.save.mockResolvedValue(mockRefreshToken);
            await useCase.execute(input);
            expect(tokenService.validateRefreshToken).toHaveBeenCalledWith(input.refreshToken);
        });
        it('should check if token was already used', async () => {
            const usedToken = refresh_token_entity_1.RefreshToken.create({
                id: 'used-token-id',
                userId: mockUser.id,
                tokenHash: MOCK_REFRESH_TOKEN_HASH,
                used: false,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                createdAt: new Date(),
            });
            usedToken.markAsUsed();
            tokenService.validateRefreshToken.mockResolvedValue(mockTokenPayload);
            userRepository.findById.mockResolvedValue(mockUser);
            refreshTokenRepository.findByUserId.mockResolvedValue([usedToken]);
            await expect(useCase.execute(input)).rejects.toThrow(token_theft_detected_exception_1.TokenTheftDetectedException);
        });
        it('should mark old token as used', async () => {
            tokenService.validateRefreshToken.mockResolvedValue(mockTokenPayload);
            userRepository.findById.mockResolvedValue(mockUser);
            refreshTokenRepository.findByUserId.mockResolvedValue([mockRefreshToken]);
            tokenService.generateTokenPair.mockResolvedValue(mockNewTokenPair);
            refreshTokenRepository.save.mockResolvedValue(mockRefreshToken);
            await useCase.execute(input);
            expect(refreshTokenRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                used: true,
            }));
        });
        it('should generate new token pair', async () => {
            tokenService.validateRefreshToken.mockResolvedValue(mockTokenPayload);
            userRepository.findById.mockResolvedValue(mockUser);
            refreshTokenRepository.findByUserId.mockResolvedValue([mockRefreshToken]);
            tokenService.generateTokenPair.mockResolvedValue(mockNewTokenPair);
            refreshTokenRepository.save.mockResolvedValue(mockRefreshToken);
            await useCase.execute(input);
            expect(tokenService.generateTokenPair).toHaveBeenCalledWith(mockUser.id, mockUser.roles);
        });
        it('should detect token theft when token is reused', async () => {
            const usedToken = refresh_token_entity_1.RefreshToken.create({
                id: 'used-token-id',
                userId: mockUser.id,
                tokenHash: MOCK_REFRESH_TOKEN_HASH,
                used: false,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                createdAt: new Date(),
            });
            usedToken.markAsUsed();
            tokenService.validateRefreshToken.mockResolvedValue(mockTokenPayload);
            userRepository.findById.mockResolvedValue(mockUser);
            refreshTokenRepository.findByUserId.mockResolvedValue([usedToken]);
            await expect(useCase.execute(input)).rejects.toThrow(token_theft_detected_exception_1.TokenTheftDetectedException);
        });
        it('should revoke all sessions when theft is detected', async () => {
            const usedToken = refresh_token_entity_1.RefreshToken.create({
                id: 'used-token-id',
                userId: mockUser.id,
                tokenHash: MOCK_REFRESH_TOKEN_HASH,
                used: false,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                createdAt: new Date(),
            });
            usedToken.markAsUsed();
            tokenService.validateRefreshToken.mockResolvedValue(mockTokenPayload);
            userRepository.findById.mockResolvedValue(mockUser);
            refreshTokenRepository.findByUserId.mockResolvedValue([usedToken]);
            try {
                await useCase.execute(input);
            }
            catch (error) {
            }
            expect(sessionManager.revokeAllUserSessions).toHaveBeenCalledWith(mockUser.id);
            expect(refreshTokenRepository.deleteAllByUserId).toHaveBeenCalledWith(mockUser.id);
        });
        it('should throw error for expired token', async () => {
            const expiredToken = refresh_token_entity_1.RefreshToken.create({
                id: 'expired-token-id',
                userId: mockUser.id,
                tokenHash: MOCK_REFRESH_TOKEN_HASH,
                used: false,
                expiresAt: new Date(Date.now() - 1000),
                createdAt: new Date(Date.now() - 10000),
            });
            tokenService.validateRefreshToken.mockResolvedValue(mockTokenPayload);
            userRepository.findById.mockResolvedValue(mockUser);
            refreshTokenRepository.findByUserId.mockResolvedValue([expiredToken]);
            await expect(useCase.execute(input)).rejects.toThrow(token_expired_exception_1.TokenExpiredException);
        });
        it('should throw error if user not found', async () => {
            tokenService.validateRefreshToken.mockResolvedValue(mockTokenPayload);
            userRepository.findById.mockResolvedValue(null);
            await expect(useCase.execute(input)).rejects.toThrow();
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
            tokenService.validateRefreshToken.mockResolvedValue(mockTokenPayload);
            userRepository.findById.mockResolvedValue(deactivatedUser);
            await expect(useCase.execute(input)).rejects.toThrow(user_deactivated_exception_1.UserDeactivatedException);
        });
        it('should return new access token and refresh token', async () => {
            tokenService.validateRefreshToken.mockResolvedValue(mockTokenPayload);
            userRepository.findById.mockResolvedValue(mockUser);
            refreshTokenRepository.findByUserId.mockResolvedValue([mockRefreshToken]);
            tokenService.generateTokenPair.mockResolvedValue(mockNewTokenPair);
            refreshTokenRepository.save.mockResolvedValue(mockRefreshToken);
            const result = await useCase.execute(input);
            expect(result).toEqual({
                accessToken: mockNewTokenPair.accessToken,
                refreshToken: mockNewTokenPair.refreshToken,
                expiresIn: mockNewTokenPair.expiresIn,
            });
        });
    });
});
//# sourceMappingURL=refresh-tokens.use-case.spec.js.map