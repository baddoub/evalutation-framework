import { Module } from '@nestjs/common'
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core'
import { JwtModule } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'

// Presentation Layer
import { AuthController } from './presentation/controllers/auth.controller'
import { JwtAuthGuard } from './presentation/guards/jwt-auth.guard'
import { AuthExceptionFilter } from './presentation/filters/auth-exception.filter'
import { AuthLoggingInterceptor } from './presentation/interceptors/auth-logging.interceptor'

// Application Layer - Use Cases
import { AuthenticateUserUseCase } from './application/use-cases/authenticate-user/authenticate-user.use-case'
import { RefreshTokensUseCase } from './application/use-cases/refresh-tokens/refresh-tokens.use-case'
import { LogoutUserUseCase } from './application/use-cases/logout-user/logout-user.use-case'
import { GetCurrentUserUseCase } from './application/use-cases/get-current-user/get-current-user.use-case'
import { RegisterUserUseCase } from './application/use-cases/register-user/register-user.use-case'
import { LoginUserUseCase } from './application/use-cases/login-user/login-user.use-case'
import { UserSynchronizationService } from './application/services/user-synchronization.service'

// Infrastructure Layer - Adapters
import { KeycloakAdapter } from './infrastructure/adapters/keycloak/keycloak.adapter'
import { KeycloakConfig } from './infrastructure/adapters/keycloak/keycloak.config'
import { JwtTokenService } from './infrastructure/adapters/jwt/jwt-token.service'
import { SessionManagerService } from './infrastructure/adapters/session/session-manager.service'

// Infrastructure Layer - Persistence
import { PrismaModule } from './infrastructure/persistence/prisma/prisma.module'
import { PrismaUserRepository } from './infrastructure/persistence/repositories/prisma-user.repository'
import { PrismaRefreshTokenRepository } from './infrastructure/persistence/repositories/prisma-refresh-token.repository'
import { PrismaSessionRepository } from './infrastructure/persistence/repositories/prisma-session.repository'

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('ACCESS_TOKEN_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('ACCESS_TOKEN_EXPIRY', '15m') as any,
        },
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 10, // 10 requests per minute (default for auth endpoints)
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [
    // Use Cases
    AuthenticateUserUseCase,
    RefreshTokensUseCase,
    LogoutUserUseCase,
    GetCurrentUserUseCase,
    RegisterUserUseCase,
    LoginUserUseCase,
    UserSynchronizationService,

    // Infrastructure - Config
    KeycloakConfig,

    // Infrastructure - Adapters (Ports Implementation)
    {
      provide: 'IKeycloakAdapter',
      useClass: KeycloakAdapter,
    },
    {
      provide: 'ITokenService',
      useClass: JwtTokenService,
    },
    {
      provide: 'ISessionManager',
      useClass: SessionManagerService,
    },

    // Infrastructure - Repositories (Ports Implementation)
    {
      provide: 'IUserRepository',
      useClass: PrismaUserRepository,
    },
    {
      provide: 'IRefreshTokenRepository',
      useClass: PrismaRefreshTokenRepository,
    },
    {
      provide: 'ISessionRepository',
      useClass: PrismaSessionRepository,
    },

    // Presentation - Guards, Filters, Interceptors
    JwtAuthGuard,
    AuthExceptionFilter,
    AuthLoggingInterceptor,

    // Global Providers
    // Throttler temporarily disabled for testing
    // {
    //   provide: APP_GUARD,
    //   useClass: ThrottlerGuard,
    // },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AuthExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuthLoggingInterceptor,
    },
  ],
  exports: ['IUserRepository', 'ITokenService', JwtAuthGuard],
})
export class AuthModule {}
