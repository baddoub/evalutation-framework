import { Session } from '../entities/session.entity';
import { UserId } from '../value-objects/user-id.vo';
export interface ISessionRepository {
    findById(id: string): Promise<Session | null>;
    findByUserId(userId: UserId): Promise<Session[]>;
    findActiveByUserId(userId: UserId): Promise<Session[]>;
    save(session: Session): Promise<Session>;
    delete(id: string): Promise<void>;
    deleteAllByUserId(userId: UserId): Promise<void>;
    deleteExpired(): Promise<number>;
}
