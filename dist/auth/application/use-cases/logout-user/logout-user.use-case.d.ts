import { ISessionManager } from '../../ports/session-manager.interface';
import { IRefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.interface';
import { LogoutUserInput } from './logout-user.input';
export declare class LogoutUserUseCase {
    private readonly sessionManager;
    private readonly refreshTokenRepository;
    constructor(sessionManager: ISessionManager, refreshTokenRepository: IRefreshTokenRepository);
    execute(input: LogoutUserInput): Promise<void>;
}
