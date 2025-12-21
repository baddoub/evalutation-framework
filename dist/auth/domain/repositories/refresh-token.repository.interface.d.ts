import { RefreshToken } from '../entities/refresh-token.entity';
import { UserId } from '../value-objects/user-id.vo';
export interface IRefreshTokenRepository {
    findById(id: string): Promise<RefreshToken | null>;
    findByTokenHash(hash: string): Promise<RefreshToken | null>;
    findByUserId(userId: UserId): Promise<RefreshToken[]>;
    save(token: RefreshToken): Promise<RefreshToken>;
    delete(id: string): Promise<void>;
    deleteAllByUserId(userId: UserId): Promise<void>;
    deleteExpiredAndRevoked(): Promise<number>;
}
