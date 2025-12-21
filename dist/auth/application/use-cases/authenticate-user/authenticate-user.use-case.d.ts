import { IKeycloakAdapter } from '../../ports/keycloak-adapter.interface';
import { ITokenService } from '../../ports/token-service.interface';
import { ISessionManager } from '../../ports/session-manager.interface';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { IRefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.interface';
import { AuthenticateUserInput } from './authenticate-user.input';
import { AuthenticateUserOutput } from './authenticate-user.output';
export declare class AuthenticateUserUseCase {
    private readonly keycloakAdapter;
    private readonly tokenService;
    private readonly sessionManager;
    private readonly userRepository;
    private readonly refreshTokenRepository;
    constructor(keycloakAdapter: IKeycloakAdapter, tokenService: ITokenService, sessionManager: ISessionManager, userRepository: IUserRepository, refreshTokenRepository: IRefreshTokenRepository);
    execute(input: AuthenticateUserInput): Promise<AuthenticateUserOutput>;
}
