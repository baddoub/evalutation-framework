"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const logout_user_use_case_1 = require("./logout-user.use-case");
const user_id_vo_1 = require("../../../domain/value-objects/user-id.vo");
describe('LogoutUserUseCase', () => {
    let useCase;
    let sessionManager;
    let refreshTokenRepository;
    const mockUserId = user_id_vo_1.UserId.generate();
    beforeEach(async () => {
        const mockSessionManager = {
            createSession: jest.fn(),
            findByRefreshToken: jest.fn(),
            markTokenAsUsed: jest.fn(),
            updateSession: jest.fn(),
            revokeAllUserSessions: jest.fn(),
            findActiveSessions: jest.fn(),
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
                logout_user_use_case_1.LogoutUserUseCase,
                { provide: 'ISessionManager', useValue: mockSessionManager },
                {
                    provide: 'IRefreshTokenRepository',
                    useValue: mockRefreshTokenRepository,
                },
            ],
        }).compile();
        useCase = module.get(logout_user_use_case_1.LogoutUserUseCase);
        sessionManager = module.get('ISessionManager');
        refreshTokenRepository = module.get('IRefreshTokenRepository');
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('execute', () => {
        const input = {
            userId: mockUserId,
        };
        it('should revoke all user sessions', async () => {
            sessionManager.revokeAllUserSessions.mockResolvedValue(undefined);
            refreshTokenRepository.deleteAllByUserId.mockResolvedValue(undefined);
            await useCase.execute(input);
            expect(sessionManager.revokeAllUserSessions).toHaveBeenCalledWith(mockUserId);
        });
        it('should delete all user refresh tokens', async () => {
            sessionManager.revokeAllUserSessions.mockResolvedValue(undefined);
            refreshTokenRepository.deleteAllByUserId.mockResolvedValue(undefined);
            await useCase.execute(input);
            expect(refreshTokenRepository.deleteAllByUserId).toHaveBeenCalledWith(mockUserId);
        });
        it('should handle already logged out user gracefully', async () => {
            sessionManager.revokeAllUserSessions.mockResolvedValue(undefined);
            refreshTokenRepository.deleteAllByUserId.mockResolvedValue(undefined);
            await expect(useCase.execute(input)).resolves.not.toThrow();
        });
        it('should complete successfully', async () => {
            sessionManager.revokeAllUserSessions.mockResolvedValue(undefined);
            refreshTokenRepository.deleteAllByUserId.mockResolvedValue(undefined);
            await useCase.execute(input);
            expect(sessionManager.revokeAllUserSessions).toHaveBeenCalled();
            expect(refreshTokenRepository.deleteAllByUserId).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=logout-user.use-case.spec.js.map