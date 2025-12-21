import { Response, Request } from 'express';
import { AuthCallbackDto } from '../dto/requests/auth-callback.dto';
import { RegisterDto } from '../dto/requests/register.dto';
import { LoginDto } from '../dto/requests/login.dto';
import { AuthorizationUrlResponseDto } from '../dto/responses/authorization-url-response.dto';
import { AuthResponseDto } from '../dto/responses/auth-response.dto';
import { TokenResponseDto } from '../dto/responses/token-response.dto';
import { UserResponseDto } from '../dto/responses/user-response.dto';
import { AuthenticateUserUseCase } from '../../application/use-cases/authenticate-user/authenticate-user.use-case';
import { RefreshTokensUseCase } from '../../application/use-cases/refresh-tokens/refresh-tokens.use-case';
import { LogoutUserUseCase } from '../../application/use-cases/logout-user/logout-user.use-case';
import { GetCurrentUserUseCase } from '../../application/use-cases/get-current-user/get-current-user.use-case';
import { RegisterUserUseCase } from '../../application/use-cases/register-user/register-user.use-case';
import { LoginUserUseCase } from '../../application/use-cases/login-user/login-user.use-case';
import { KeycloakConfig } from '../../infrastructure/adapters/keycloak/keycloak.config';
export declare class AuthController {
    private readonly authenticateUserUseCase;
    private readonly refreshTokensUseCase;
    private readonly logoutUserUseCase;
    private readonly getCurrentUserUseCase;
    private readonly registerUserUseCase;
    private readonly loginUserUseCase;
    private readonly keycloakConfig;
    constructor(authenticateUserUseCase: AuthenticateUserUseCase, refreshTokensUseCase: RefreshTokensUseCase, logoutUserUseCase: LogoutUserUseCase, getCurrentUserUseCase: GetCurrentUserUseCase, registerUserUseCase: RegisterUserUseCase, loginUserUseCase: LoginUserUseCase, keycloakConfig: KeycloakConfig);
    register(dto: RegisterDto, response: Response): Promise<AuthResponseDto>;
    login(dto: LoginDto, response: Response): Promise<AuthResponseDto>;
    initiateLogin(response: Response): AuthorizationUrlResponseDto;
    handleCallback(dto: AuthCallbackDto, request: Request, response: Response): Promise<AuthResponseDto>;
    refreshTokens(request: Request, response: Response): Promise<TokenResponseDto>;
    logout(user: {
        id: string;
    }, response: Response): Promise<{
        message: string;
    }>;
    getCurrentUser(user: {
        id: string;
    }): Promise<UserResponseDto>;
}
