import { ISessionManager, CreateSessionDto, UpdateSessionDto } from '../../../application/ports/session-manager.interface';
import { Session } from '../../../domain/entities/session.entity';
import { UserId } from '../../../domain/value-objects/user-id.vo';
import { ISessionRepository } from '../../../domain/repositories/session.repository.interface';
import { IRefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.interface';
import { ITokenService } from '../../../application/ports/token-service.interface';
export declare class SessionManagerService implements ISessionManager {
    private readonly sessionRepository;
    private readonly refreshTokenRepository;
    private readonly tokenService;
    constructor(sessionRepository: ISessionRepository, refreshTokenRepository: IRefreshTokenRepository, tokenService: ITokenService);
    createSession(data: CreateSessionDto): Promise<Session>;
    findByRefreshToken(token: string): Promise<Session | null>;
    markTokenAsUsed(token: string): Promise<void>;
    updateSession(data: UpdateSessionDto): Promise<void>;
    revokeAllUserSessions(userId: UserId): Promise<void>;
    findActiveSessions(userId: UserId): Promise<Session[]>;
}
