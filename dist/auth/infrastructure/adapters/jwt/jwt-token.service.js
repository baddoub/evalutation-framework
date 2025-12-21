"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtTokenService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const invalid_token_exception_1 = require("../../exceptions/invalid-token.exception");
const crypto_1 = require("crypto");
let JwtTokenService = class JwtTokenService {
    constructor(jwtService, configService) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.revokedTokens = new Set();
        this.accessTokenSecret = this.configService.getOrThrow('ACCESS_TOKEN_SECRET');
        this.refreshTokenSecret = this.configService.getOrThrow('REFRESH_TOKEN_SECRET');
        this.accessTokenExpiry = this.configService.get('ACCESS_TOKEN_EXPIRY', '15m');
        this.refreshTokenExpiry = this.configService.get('REFRESH_TOKEN_EXPIRY', '7d');
    }
    async generateTokenPair(userId, roles) {
        const payload = {
            sub: userId.value,
            roles: roles.map((role) => role.value),
            jti: (0, crypto_1.randomUUID)(),
        };
        const accessToken = this.jwtService.sign(payload, {
            secret: this.accessTokenSecret,
            expiresIn: this.accessTokenExpiry,
        });
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.refreshTokenSecret,
            expiresIn: this.refreshTokenExpiry,
        });
        const expiresIn = this.parseExpiryToSeconds(this.accessTokenExpiry);
        return {
            accessToken,
            refreshToken,
            expiresIn,
        };
    }
    async validateAccessToken(token) {
        try {
            const payload = this.jwtService.verify(token, {
                secret: this.accessTokenSecret,
            });
            if (this.revokedTokens.has(payload.jti)) {
                throw new invalid_token_exception_1.InvalidTokenException('Token has been revoked');
            }
            return payload;
        }
        catch (error) {
            if (error instanceof invalid_token_exception_1.InvalidTokenException) {
                throw error;
            }
            throw new invalid_token_exception_1.InvalidTokenException('Invalid access token', error);
        }
    }
    async validateRefreshToken(token) {
        try {
            const payload = this.jwtService.verify(token, {
                secret: this.refreshTokenSecret,
            });
            if (this.revokedTokens.has(payload.jti)) {
                throw new invalid_token_exception_1.InvalidTokenException('Token has been revoked');
            }
            return payload;
        }
        catch (error) {
            if (error instanceof invalid_token_exception_1.InvalidTokenException) {
                throw error;
            }
            throw new invalid_token_exception_1.InvalidTokenException('Invalid refresh token', error);
        }
    }
    decodeToken(token) {
        const decoded = this.jwtService.decode(token);
        if (!decoded) {
            throw new invalid_token_exception_1.InvalidTokenException('Failed to decode token');
        }
        return decoded;
    }
    async revokeToken(tokenId) {
        this.revokedTokens.add(tokenId);
    }
    parseExpiryToSeconds(expiry) {
        const match = expiry.match(/^(\d+)([smhd])$/);
        if (!match) {
            throw new Error(`Invalid expiry format: ${expiry}`);
        }
        const value = parseInt(match[1], 10);
        const unit = match[2];
        const multipliers = {
            s: 1,
            m: 60,
            h: 60 * 60,
            d: 24 * 60 * 60,
        };
        return value * multipliers[unit];
    }
};
exports.JwtTokenService = JwtTokenService;
exports.JwtTokenService = JwtTokenService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService])
], JwtTokenService);
//# sourceMappingURL=jwt-token.service.js.map