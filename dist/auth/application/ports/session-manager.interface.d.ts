import { UserId } from '../../domain/value-objects/user-id.vo';
import { Session } from '../../domain/entities/session.entity';
export interface CreateSessionDto {
    userId: UserId;
    deviceId?: string;
    userAgent?: string;
    ipAddress?: string;
    expiresAt: Date;
}
export interface UpdateSessionDto {
    sessionId: string;
    lastUsed?: Date;
    expiresAt?: Date;
}
export interface ISessionManager {
    createSession(data: CreateSessionDto): Promise<Session>;
    findByRefreshToken(token: string): Promise<Session | null>;
    markTokenAsUsed(token: string): Promise<void>;
    updateSession(data: UpdateSessionDto): Promise<void>;
    revokeAllUserSessions(userId: UserId): Promise<void>;
    findActiveSessions(userId: UserId): Promise<Session[]>;
}
