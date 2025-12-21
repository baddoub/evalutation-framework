"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const auth_controller_1 = require("./presentation/controllers/auth.controller");
const jwt_auth_guard_1 = require("./presentation/guards/jwt-auth.guard");
const auth_exception_filter_1 = require("./presentation/filters/auth-exception.filter");
const auth_logging_interceptor_1 = require("./presentation/interceptors/auth-logging.interceptor");
const authenticate_user_use_case_1 = require("./application/use-cases/authenticate-user/authenticate-user.use-case");
const refresh_tokens_use_case_1 = require("./application/use-cases/refresh-tokens/refresh-tokens.use-case");
const logout_user_use_case_1 = require("./application/use-cases/logout-user/logout-user.use-case");
const get_current_user_use_case_1 = require("./application/use-cases/get-current-user/get-current-user.use-case");
const register_user_use_case_1 = require("./application/use-cases/register-user/register-user.use-case");
const login_user_use_case_1 = require("./application/use-cases/login-user/login-user.use-case");
const user_synchronization_service_1 = require("./application/services/user-synchronization.service");
const keycloak_adapter_1 = require("./infrastructure/adapters/keycloak/keycloak.adapter");
const keycloak_config_1 = require("./infrastructure/adapters/keycloak/keycloak.config");
const jwt_token_service_1 = require("./infrastructure/adapters/jwt/jwt-token.service");
const session_manager_service_1 = require("./infrastructure/adapters/session/session-manager.service");
const prisma_module_1 = require("./infrastructure/persistence/prisma/prisma.module");
const prisma_user_repository_1 = require("./infrastructure/persistence/repositories/prisma-user.repository");
const prisma_refresh_token_repository_1 = require("./infrastructure/persistence/repositories/prisma-refresh-token.repository");
const prisma_session_repository_1 = require("./infrastructure/persistence/repositories/prisma-session.repository");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            jwt_1.JwtModule.registerAsync({
                useFactory: (configService) => ({
                    secret: configService.get('ACCESS_TOKEN_SECRET'),
                    signOptions: {
                        expiresIn: configService.get('ACCESS_TOKEN_EXPIRY', '15m'),
                    },
                }),
                inject: [config_1.ConfigService],
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 10,
                },
            ]),
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [
            authenticate_user_use_case_1.AuthenticateUserUseCase,
            refresh_tokens_use_case_1.RefreshTokensUseCase,
            logout_user_use_case_1.LogoutUserUseCase,
            get_current_user_use_case_1.GetCurrentUserUseCase,
            register_user_use_case_1.RegisterUserUseCase,
            login_user_use_case_1.LoginUserUseCase,
            user_synchronization_service_1.UserSynchronizationService,
            keycloak_config_1.KeycloakConfig,
            {
                provide: 'IKeycloakAdapter',
                useClass: keycloak_adapter_1.KeycloakAdapter,
            },
            {
                provide: 'ITokenService',
                useClass: jwt_token_service_1.JwtTokenService,
            },
            {
                provide: 'ISessionManager',
                useClass: session_manager_service_1.SessionManagerService,
            },
            {
                provide: 'IUserRepository',
                useClass: prisma_user_repository_1.PrismaUserRepository,
            },
            {
                provide: 'IRefreshTokenRepository',
                useClass: prisma_refresh_token_repository_1.PrismaRefreshTokenRepository,
            },
            {
                provide: 'ISessionRepository',
                useClass: prisma_session_repository_1.PrismaSessionRepository,
            },
            jwt_auth_guard_1.JwtAuthGuard,
            auth_exception_filter_1.AuthExceptionFilter,
            auth_logging_interceptor_1.AuthLoggingInterceptor,
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: jwt_auth_guard_1.JwtAuthGuard,
            },
            {
                provide: core_1.APP_FILTER,
                useClass: auth_exception_filter_1.AuthExceptionFilter,
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: auth_logging_interceptor_1.AuthLoggingInterceptor,
            },
        ],
        exports: ['IUserRepository', 'ITokenService', jwt_auth_guard_1.JwtAuthGuard],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map