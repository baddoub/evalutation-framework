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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_callback_dto_1 = require("../dto/requests/auth-callback.dto");
const register_dto_1 = require("../dto/requests/register.dto");
const login_dto_1 = require("../dto/requests/login.dto");
const authorization_url_response_dto_1 = require("../dto/responses/authorization-url-response.dto");
const auth_response_dto_1 = require("../dto/responses/auth-response.dto");
const token_response_dto_1 = require("../dto/responses/token-response.dto");
const user_response_dto_1 = require("../dto/responses/user-response.dto");
const public_decorator_1 = require("../decorators/public.decorator");
const current_user_decorator_1 = require("../decorators/current-user.decorator");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const authenticate_user_use_case_1 = require("../../application/use-cases/authenticate-user/authenticate-user.use-case");
const refresh_tokens_use_case_1 = require("../../application/use-cases/refresh-tokens/refresh-tokens.use-case");
const logout_user_use_case_1 = require("../../application/use-cases/logout-user/logout-user.use-case");
const get_current_user_use_case_1 = require("../../application/use-cases/get-current-user/get-current-user.use-case");
const register_user_use_case_1 = require("../../application/use-cases/register-user/register-user.use-case");
const login_user_use_case_1 = require("../../application/use-cases/login-user/login-user.use-case");
const keycloak_config_1 = require("../../infrastructure/adapters/keycloak/keycloak.config");
const pkce_helper_1 = require("../utils/pkce.helper");
const user_id_vo_1 = require("../../domain/value-objects/user-id.vo");
let AuthController = class AuthController {
    constructor(authenticateUserUseCase, refreshTokensUseCase, logoutUserUseCase, getCurrentUserUseCase, registerUserUseCase, loginUserUseCase, keycloakConfig) {
        this.authenticateUserUseCase = authenticateUserUseCase;
        this.refreshTokensUseCase = refreshTokensUseCase;
        this.logoutUserUseCase = logoutUserUseCase;
        this.getCurrentUserUseCase = getCurrentUserUseCase;
        this.registerUserUseCase = registerUserUseCase;
        this.loginUserUseCase = loginUserUseCase;
        this.keycloakConfig = keycloakConfig;
    }
    async register(dto, response) {
        const result = await this.registerUserUseCase.execute({
            email: dto.email,
            password: dto.password,
            name: dto.name,
        });
        response.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/auth/refresh',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return {
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            expiresIn: result.expiresIn,
            user: {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name,
                roles: result.user.roles,
                isActive: result.user.isActive,
                createdAt: result.user.createdAt.toISOString(),
                updatedAt: result.user.updatedAt.toISOString(),
            },
        };
    }
    async login(dto, response) {
        const result = await this.loginUserUseCase.execute({
            email: dto.email,
            password: dto.password,
        });
        response.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/auth/refresh',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return {
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            expiresIn: result.expiresIn,
            user: {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name,
                roles: result.user.roles,
                isActive: result.user.isActive,
                createdAt: result.user.createdAt.toISOString(),
                updatedAt: result.user.updatedAt.toISOString(),
            },
        };
    }
    initiateLogin(response) {
        const codeVerifier = pkce_helper_1.PkceHelper.generateCodeVerifier();
        const codeChallenge = pkce_helper_1.PkceHelper.generateCodeChallenge(codeVerifier);
        const state = pkce_helper_1.PkceHelper.generateState();
        response.cookie('oauth_state', state, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 5 * 60 * 1000,
        });
        response.cookie('code_verifier', codeVerifier, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 5 * 60 * 1000,
        });
        const params = new URLSearchParams({
            client_id: this.keycloakConfig.clientId,
            redirect_uri: this.keycloakConfig.redirectUri,
            response_type: 'code',
            scope: 'openid email profile',
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
            state,
        });
        const authorizationUrl = `${this.keycloakConfig.authorizationEndpoint}?${params.toString()}`;
        return {
            authorizationUrl,
            codeVerifier,
            state,
        };
    }
    async handleCallback(dto, request, response) {
        const storedState = request.cookies?.oauth_state;
        if (!storedState || storedState !== dto.state) {
            throw new common_1.UnauthorizedException('Invalid state parameter - possible CSRF attack');
        }
        response.clearCookie('oauth_state');
        const storedCodeVerifier = request.cookies?.code_verifier;
        const codeVerifier = storedCodeVerifier || dto.codeVerifier;
        if (storedCodeVerifier) {
            response.clearCookie('code_verifier');
        }
        const result = await this.authenticateUserUseCase.execute({
            authorizationCode: dto.code,
            codeVerifier,
        });
        response.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/auth/refresh',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return {
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            expiresIn: result.expiresIn,
            user: {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name,
                roles: result.user.roles,
                isActive: result.user.isActive,
                createdAt: result.user.createdAt.toISOString(),
                updatedAt: result.user.updatedAt.toISOString(),
            },
        };
    }
    async refreshTokens(request, response) {
        const refreshToken = request.cookies?.refreshToken;
        if (!refreshToken) {
            throw new Error('Refresh token not found');
        }
        const result = await this.refreshTokensUseCase.execute({
            refreshToken,
        });
        response.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/auth/refresh',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return {
            accessToken: result.accessToken,
            expiresIn: result.expiresIn,
        };
    }
    async logout(user, response) {
        await this.logoutUserUseCase.execute({
            userId: user_id_vo_1.UserId.fromString(user.id),
        });
        response.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/auth/refresh',
        });
        return {
            message: 'Logout successful',
        };
    }
    async getCurrentUser(user) {
        const result = await this.getCurrentUserUseCase.execute({
            userId: user_id_vo_1.UserId.fromString(user.id),
        });
        return {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            roles: result.user.roles,
            isActive: result.user.isActive,
            createdAt: result.user.createdAt.toISOString(),
            updatedAt: result.user.updatedAt.toISOString(),
        };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('register'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Register new user with email and password' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'User registered successfully',
        type: auth_response_dto_1.AuthResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'User already exists' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_1.RegisterDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Login with email and password' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Login successful',
        type: auth_response_dto_1.AuthResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid credentials' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('oauth/login'),
    (0, swagger_1.ApiOperation)({ summary: 'Initiate OAuth login' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Authorization URL successfully generated',
        type: authorization_url_response_dto_1.AuthorizationUrlResponseDto,
    }),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", authorization_url_response_dto_1.AuthorizationUrlResponseDto)
], AuthController.prototype, "initiateLogin", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('callback'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'OAuth callback endpoint' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'User authenticated successfully',
        type: auth_response_dto_1.AuthResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Authentication failed' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_callback_dto_1.AuthCallbackDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "handleCallback", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Refresh access token' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Tokens refreshed successfully',
        type: token_response_dto_1.TokenResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid or expired refresh token' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refreshTokens", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Logout user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Logout successful' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user profile' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'User profile retrieved successfully',
        type: user_response_dto_1.UserResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'User account is deactivated' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getCurrentUser", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Authentication'),
    (0, common_1.Controller)('auth'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(6, (0, common_1.Inject)(keycloak_config_1.KeycloakConfig)),
    __metadata("design:paramtypes", [authenticate_user_use_case_1.AuthenticateUserUseCase,
        refresh_tokens_use_case_1.RefreshTokensUseCase,
        logout_user_use_case_1.LogoutUserUseCase,
        get_current_user_use_case_1.GetCurrentUserUseCase,
        register_user_use_case_1.RegisterUserUseCase,
        login_user_use_case_1.LoginUserUseCase,
        keycloak_config_1.KeycloakConfig])
], AuthController);
//# sourceMappingURL=auth.controller.js.map