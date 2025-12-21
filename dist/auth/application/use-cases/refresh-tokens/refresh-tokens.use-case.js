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
exports.RefreshTokensUseCase = void 0;
const common_1 = require("@nestjs/common");
const refresh_tokens_output_1 = require("./refresh-tokens.output");
const user_id_vo_1 = require("../../../domain/value-objects/user-id.vo");
const token_expired_exception_1 = require("../../exceptions/token-expired.exception");
const token_theft_detected_exception_1 = require("../../exceptions/token-theft-detected.exception");
const user_deactivated_exception_1 = require("../../exceptions/user-deactivated.exception");
const user_not_found_exception_1 = require("../../exceptions/user-not-found.exception");
const bcrypt = __importStar(require("bcrypt"));
let RefreshTokensUseCase = class RefreshTokensUseCase {
    constructor(tokenService, sessionManager, userRepository, refreshTokenRepository) {
        this.tokenService = tokenService;
        this.sessionManager = sessionManager;
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
    }
    async execute(input) {
        const tokenPayload = await this.tokenService.validateRefreshToken(input.refreshToken);
        const userId = user_id_vo_1.UserId.fromString(tokenPayload.sub);
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new user_not_found_exception_1.UserNotFoundException('User not found');
        }
        if (!user.isActive) {
            throw new user_deactivated_exception_1.UserDeactivatedException('User account is deactivated. Cannot refresh token.');
        }
        const userTokens = await this.refreshTokenRepository.findByUserId(userId);
        let refreshToken = null;
        for (const token of userTokens) {
            const matches = await bcrypt.compare(input.refreshToken, token.tokenHash);
            if (matches) {
                refreshToken = token;
                break;
            }
        }
        if (!refreshToken) {
            throw new token_expired_exception_1.TokenExpiredException('Refresh token not found or expired');
        }
        if (refreshToken.used) {
            await this.handleTokenTheft(userId);
            throw new token_theft_detected_exception_1.TokenTheftDetectedException('Token reuse detected. All sessions have been revoked for security.');
        }
        if (refreshToken.isExpired()) {
            throw new token_expired_exception_1.TokenExpiredException('Refresh token has expired');
        }
        refreshToken.markAsUsed();
        await this.refreshTokenRepository.save(refreshToken);
        const newTokenPair = await this.tokenService.generateTokenPair(user.id, user.roles);
        const { RefreshToken } = await Promise.resolve().then(() => __importStar(require('../../../domain/entities/refresh-token.entity')));
        const newRefreshToken = RefreshToken.create({
            id: user_id_vo_1.UserId.generate().value,
            userId: user.id,
            tokenHash: await bcrypt.hash(newTokenPair.refreshToken, 10),
            used: false,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            createdAt: new Date(),
        });
        await this.refreshTokenRepository.save(newRefreshToken);
        return new refresh_tokens_output_1.RefreshTokensOutput(newTokenPair.accessToken, newTokenPair.refreshToken, newTokenPair.expiresIn);
    }
    async handleTokenTheft(userId) {
        await this.sessionManager.revokeAllUserSessions(userId);
        await this.refreshTokenRepository.deleteAllByUserId(userId);
    }
};
exports.RefreshTokensUseCase = RefreshTokensUseCase;
exports.RefreshTokensUseCase = RefreshTokensUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('ITokenService')),
    __param(1, (0, common_1.Inject)('ISessionManager')),
    __param(2, (0, common_1.Inject)('IUserRepository')),
    __param(3, (0, common_1.Inject)('IRefreshTokenRepository')),
    __metadata("design:paramtypes", [Object, Object, Object, Object])
], RefreshTokensUseCase);
//# sourceMappingURL=refresh-tokens.use-case.js.map