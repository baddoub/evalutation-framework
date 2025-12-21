"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const get_current_user_use_case_1 = require("./get-current-user.use-case");
const user_entity_1 = require("../../../domain/entities/user.entity");
const user_id_vo_1 = require("../../../domain/value-objects/user-id.vo");
const email_vo_1 = require("../../../domain/value-objects/email.vo");
const role_vo_1 = require("../../../domain/value-objects/role.vo");
const user_not_found_exception_1 = require("../../exceptions/user-not-found.exception");
const user_deactivated_exception_1 = require("../../exceptions/user-deactivated.exception");
describe('GetCurrentUserUseCase', () => {
    let useCase;
    let userRepository;
    const mockUserId = user_id_vo_1.UserId.generate();
    const mockUser = user_entity_1.User.create({
        id: mockUserId,
        email: email_vo_1.Email.create('test@example.com'),
        name: 'Test User',
        keycloakId: 'keycloak-user-id-123',
        roles: [role_vo_1.Role.user()],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    });
    beforeEach(async () => {
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
        const module = await testing_1.Test.createTestingModule({
            providers: [
                get_current_user_use_case_1.GetCurrentUserUseCase,
                { provide: 'IUserRepository', useValue: mockUserRepository },
            ],
        }).compile();
        useCase = module.get(get_current_user_use_case_1.GetCurrentUserUseCase);
        userRepository = module.get('IUserRepository');
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('execute', () => {
        const input = {
            userId: mockUserId,
        };
        it('should return user by ID', async () => {
            userRepository.findById.mockResolvedValue(mockUser);
            const result = await useCase.execute(input);
            expect(userRepository.findById).toHaveBeenCalledWith(mockUserId);
            expect(result.user).toEqual(expect.objectContaining({
                id: mockUser.id.value,
                email: mockUser.email.value,
                name: mockUser.name,
            }));
        });
        it('should throw error if user not found', async () => {
            userRepository.findById.mockResolvedValue(null);
            await expect(useCase.execute(input)).rejects.toThrow(user_not_found_exception_1.UserNotFoundException);
        });
        it('should throw error if user deactivated', async () => {
            const deactivatedUser = user_entity_1.User.create({
                id: mockUserId,
                email: email_vo_1.Email.create('test@example.com'),
                name: 'Test User',
                keycloakId: 'keycloak-user-id-123',
                roles: [role_vo_1.Role.user()],
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            deactivatedUser.deactivate();
            userRepository.findById.mockResolvedValue(deactivatedUser);
            await expect(useCase.execute(input)).rejects.toThrow(user_deactivated_exception_1.UserDeactivatedException);
        });
        it('should return complete user information', async () => {
            userRepository.findById.mockResolvedValue(mockUser);
            const result = await useCase.execute(input);
            expect(result.user).toHaveProperty('id');
            expect(result.user).toHaveProperty('email');
            expect(result.user).toHaveProperty('name');
            expect(result.user).toHaveProperty('roles');
            expect(result.user).toHaveProperty('isActive');
            expect(result.user).toHaveProperty('createdAt');
            expect(result.user).toHaveProperty('updatedAt');
        });
    });
});
//# sourceMappingURL=get-current-user.use-case.spec.js.map