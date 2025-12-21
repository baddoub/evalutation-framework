import { ITokenService } from '../../ports/token-service.interface';
import { ISessionManager } from '../../ports/session-manager.interface';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { IRefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.interface';
import { RefreshTokensInput } from './refresh-tokens.input';
import { RefreshTokensOutput } from './refresh-tokens.output';
export declare class RefreshTokensUseCase {
    private readonly tokenService;
    private readonly sessionManager;
    private readonly userRepository;
    private readonly refreshTokenRepository;
    constructor(tokenService: ITokenService, sessionManager: ISessionManager, userRepository: IUserRepository, refreshTokenRepository: IRefreshTokenRepository);
    execute(input: RefreshTokensInput): Promise<RefreshTokensOutput>;
    private handleTokenTheft;
}
