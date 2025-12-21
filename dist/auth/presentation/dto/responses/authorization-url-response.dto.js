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
exports.AuthorizationUrlResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class AuthorizationUrlResponseDto {
}
exports.AuthorizationUrlResponseDto = AuthorizationUrlResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'https://keycloak.example.com/realms/my-realm/protocol/openid-connect/auth?...',
        description: 'Full Keycloak authorization URL for user redirect',
    }),
    __metadata("design:type", String)
], AuthorizationUrlResponseDto.prototype, "authorizationUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
        description: 'PKCE code verifier to be sent in callback',
    }),
    __metadata("design:type", String)
], AuthorizationUrlResponseDto.prototype, "codeVerifier", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'xyz123',
        description: 'CSRF state parameter to validate callback',
    }),
    __metadata("design:type", String)
], AuthorizationUrlResponseDto.prototype, "state", void 0);
//# sourceMappingURL=authorization-url-response.dto.js.map