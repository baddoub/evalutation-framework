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
exports.KeycloakConfig = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let KeycloakConfig = class KeycloakConfig {
    constructor(configService) {
        this.configService = configService;
    }
    get url() {
        return this.configService.getOrThrow('KEYCLOAK_URL');
    }
    get realm() {
        return this.configService.getOrThrow('KEYCLOAK_REALM');
    }
    get clientId() {
        return this.configService.getOrThrow('KEYCLOAK_CLIENT_ID');
    }
    get clientSecret() {
        return this.configService.getOrThrow('KEYCLOAK_CLIENT_SECRET');
    }
    get redirectUri() {
        return this.configService.getOrThrow('KEYCLOAK_REDIRECT_URI');
    }
    get tokenEndpoint() {
        return `${this.url}/realms/${this.realm}/protocol/openid-connect/token`;
    }
    get userInfoEndpoint() {
        return `${this.url}/realms/${this.realm}/protocol/openid-connect/userinfo`;
    }
    get introspectionEndpoint() {
        return `${this.url}/realms/${this.realm}/protocol/openid-connect/token/introspect`;
    }
    get logoutEndpoint() {
        return `${this.url}/realms/${this.realm}/protocol/openid-connect/logout`;
    }
    get jwksEndpoint() {
        return `${this.url}/realms/${this.realm}/protocol/openid-connect/certs`;
    }
    get authorizationEndpoint() {
        return `${this.url}/realms/${this.realm}/protocol/openid-connect/auth`;
    }
};
exports.KeycloakConfig = KeycloakConfig;
exports.KeycloakConfig = KeycloakConfig = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], KeycloakConfig);
//# sourceMappingURL=keycloak.config.js.map