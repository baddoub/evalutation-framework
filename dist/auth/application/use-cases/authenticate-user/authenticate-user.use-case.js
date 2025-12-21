"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticateUserUseCase = void 0;
const common_1 = require("@nestjs/common");
const authenticate_user_output_1 = require("./authenticate-user.output");
const user_entity_1 = require("../../../domain/entities/user.entity");
const user_id_vo_1 = require("../../../domain/value-objects/user-id.vo");
const email_vo_1 = require("../../../domain/value-objects/email.vo");
const role_vo_1 = require("../../../domain/value-objects/role.vo");
const user_dto_1 = require("../../dto/user.dto");
const authentication_failed_exception_1 = require("../../exceptions/authentication-failed.exception");
const user_deactivated_exception_1 = require("../../exceptions/user-deactivated.exception");
const bcrypt = __importStar(require("bcrypt"));
let AuthenticateUserUseCase = class AuthenticateUserUseCase {
    constructor(keycloakAdapter, tokenService, sessionManager, userRepository, refreshTokenRepository) {
        this.keycloakAdapter = keycloakAdapter;
        this.tokenService = tokenService;
        this.sessionManager = sessionManager;
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
    }
    async execute(input) {
        try {
            const keycloakTokens = await this.keycloakAdapter.exchangeCodeForTokens(input.authorizationCode, input.codeVerifier);
            const keycloakUserInfo = await this.keycloakAdapter.validateToken(keycloakTokens.accessToken);
            let user = await this.userRepository.findByKeycloakId(keycloakUserInfo.sub);
            if (!user) {
                user = user_entity_1.User.create({
                    id: user_id_vo_1.UserId.generate(),
                    email: email_vo_1.Email.create(keycloakUserInfo.email),
                    name: keycloakUserInfo.name,
                    keycloakId: keycloakUserInfo.sub,
                    roles: [role_vo_1.Role.user()],
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
                await this.userRepository.save(user);
            }
            else {
                user.synchronizeFromKeycloak({
                    name: keycloakUserInfo.name,
                    email: email_vo_1.Email.create(keycloakUserInfo.email),
                    roles: user.roles,
                });
                await this.userRepository.save(user);
            }
            if (!user.isActive) {
                throw new user_deactivated_exception_1.UserDeactivatedException('User account is deactivated. Please contact support.');
            }
            const tokenPair = await this.tokenService.generateTokenPair(user.id, user.roles);
            const { RefreshToken } = await Promise.resolve().then(() => __importStar(require('../../../domain/entities/refresh-token.entity')));
            const refreshToken = RefreshToken.create({
                id: user_id_vo_1.UserId.generate().value,
                userId: user.id,
                tokenHash: await bcrypt.hash(tokenPair.refreshToken, 10),
                used: false,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                createdAt: new Date(),
            });
            await this.refreshTokenRepository.save(refreshToken);
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            await this.sessionManager.createSession({
                userId: user.id,
                deviceId: input.deviceId,
                userAgent: input.userAgent,
                ipAddress: input.ipAddress,
                expiresAt,
            });
            return new authenticate_user_output_1.AuthenticateUserOutput(user_dto_1.UserDto.fromDomain(user), tokenPair.accessToken, tokenPair.refreshToken, tokenPair.expiresIn);
        }
        catch (error) {
            if (error instanceof user_deactivated_exception_1.UserDeactivatedException ||
                error instanceof authentication_failed_exception_1.AuthenticationFailedException) {
                throw error;
            }
            throw new authentication_failed_exception_1.AuthenticationFailedException(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
};
exports.AuthenticateUserUseCase = AuthenticateUserUseCase;
exports.AuthenticateUserUseCase = AuthenticateUserUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IKeycloakAdapter')),
    __param(1, (0, common_1.Inject)('ITokenService')),
    __param(2, (0, common_1.Inject)('ISessionManager')),
    __param(3, (0, common_1.Inject)('IUserRepository')),
    __param(4, (0, common_1.Inject)('IRefreshTokenRepository')),
    __metadata("design:paramtypes", [Object, Object, Object, Object, Object])
], AuthenticateUserUseCase);
//# sourceMappingURL=authenticate-user.use-case.js.map