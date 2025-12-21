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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeycloakAdapter = void 0;
const common_1 = require("@nestjs/common");
const keycloak_config_1 = require("./keycloak.config");
const keycloak_integration_exception_1 = require("../../exceptions/keycloak-integration.exception");
const jwt = __importStar(require("jsonwebtoken"));
const jwks_rsa_1 = __importDefault(require("jwks-rsa"));
let KeycloakAdapter = class KeycloakAdapter {
    constructor(config) {
        this.config = config;
        this.jwksClient = (0, jwks_rsa_1.default)({
            jwksUri: this.config.jwksEndpoint,
            cache: true,
            cacheMaxAge: 600000,
        });
    }
    async exchangeCodeForTokens(code, codeVerifier) {
        try {
            const params = new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: this.config.clientId,
                client_secret: this.config.clientSecret,
                code,
                code_verifier: codeVerifier,
                redirect_uri: this.config.redirectUri,
            });
            const response = await fetch(this.config.tokenEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params.toString(),
            });
            if (!response.ok) {
                const error = await response.text();
                throw new keycloak_integration_exception_1.KeycloakIntegrationException(`Failed to exchange code for tokens: ${error}`);
            }
            const data = await response.json();
            return {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                expiresIn: data.expires_in,
                tokenType: data.token_type,
            };
        }
        catch (error) {
            if (error instanceof keycloak_integration_exception_1.KeycloakIntegrationException) {
                throw error;
            }
            throw new keycloak_integration_exception_1.KeycloakIntegrationException('Failed to exchange authorization code', error);
        }
    }
    async validateToken(token) {
        try {
            const decoded = jwt.decode(token, { complete: true });
            if (!decoded || !decoded.header.kid) {
                throw new keycloak_integration_exception_1.KeycloakIntegrationException('Invalid token format');
            }
            const key = await this.getSigningKey(decoded.header.kid);
            const payload = jwt.verify(token, key, {
                algorithms: ['RS256'],
                issuer: `${this.config.url}/realms/${this.config.realm}`,
            });
            return {
                sub: payload.sub,
                email: payload.email,
                name: payload.name || payload.preferred_username,
                emailVerified: payload.email_verified,
                preferredUsername: payload.preferred_username,
            };
        }
        catch (error) {
            if (error instanceof keycloak_integration_exception_1.KeycloakIntegrationException) {
                throw error;
            }
            throw new keycloak_integration_exception_1.KeycloakIntegrationException('Failed to validate token', error);
        }
    }
    async refreshTokens(refreshToken) {
        try {
            const params = new URLSearchParams({
                grant_type: 'refresh_token',
                client_id: this.config.clientId,
                client_secret: this.config.clientSecret,
                refresh_token: refreshToken,
            });
            const response = await fetch(this.config.tokenEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params.toString(),
            });
            if (!response.ok) {
                const error = await response.text();
                throw new keycloak_integration_exception_1.KeycloakIntegrationException(`Failed to refresh tokens: ${error}`);
            }
            const data = await response.json();
            return {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                expiresIn: data.expires_in,
                tokenType: data.token_type,
            };
        }
        catch (error) {
            if (error instanceof keycloak_integration_exception_1.KeycloakIntegrationException) {
                throw error;
            }
            throw new keycloak_integration_exception_1.KeycloakIntegrationException('Failed to refresh tokens', error);
        }
    }
    async revokeToken(token) {
        try {
            const params = new URLSearchParams({
                client_id: this.config.clientId,
                client_secret: this.config.clientSecret,
                token,
            });
            const response = await fetch(this.config.logoutEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params.toString(),
            });
            if (!response.ok) {
                const error = await response.text();
                throw new keycloak_integration_exception_1.KeycloakIntegrationException(`Failed to revoke token: ${error}`);
            }
        }
        catch (error) {
            if (error instanceof keycloak_integration_exception_1.KeycloakIntegrationException) {
                throw error;
            }
            throw new keycloak_integration_exception_1.KeycloakIntegrationException('Failed to revoke token', error);
        }
    }
    async getUserInfo(accessToken) {
        try {
            const response = await fetch(this.config.userInfoEndpoint, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            if (!response.ok) {
                const error = await response.text();
                throw new keycloak_integration_exception_1.KeycloakIntegrationException(`Failed to get user info: ${error}`);
            }
            const data = await response.json();
            return {
                sub: data.sub,
                email: data.email,
                name: data.name || data.preferred_username,
                emailVerified: data.email_verified,
                preferredUsername: data.preferred_username,
            };
        }
        catch (error) {
            if (error instanceof keycloak_integration_exception_1.KeycloakIntegrationException) {
                throw error;
            }
            throw new keycloak_integration_exception_1.KeycloakIntegrationException('Failed to get user info', error);
        }
    }
    async getSigningKey(kid) {
        return new Promise((resolve, reject) => {
            this.jwksClient.getSigningKey(kid, (err, key) => {
                if (err) {
                    reject(new keycloak_integration_exception_1.KeycloakIntegrationException('Failed to get signing key', err));
                }
                else {
                    const signingKey = key?.getPublicKey();
                    if (!signingKey) {
                        reject(new keycloak_integration_exception_1.KeycloakIntegrationException('Signing key not found'));
                    }
                    else {
                        resolve(signingKey);
                    }
                }
            });
        });
    }
};
exports.KeycloakAdapter = KeycloakAdapter;
exports.KeycloakAdapter = KeycloakAdapter = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [keycloak_config_1.KeycloakConfig])
], KeycloakAdapter);
//# sourceMappingURL=keycloak.adapter.js.map