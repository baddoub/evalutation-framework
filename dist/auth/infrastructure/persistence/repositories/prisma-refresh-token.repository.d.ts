import { IRefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository.interface';
import { RefreshToken } from '../../../domain/entities/refresh-token.entity';
import { UserId } from '../../../domain/value-objects/user-id.vo';
import { PrismaService } from '../prisma/prisma.service';
export declare class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<RefreshToken | null>;
    findByTokenHash(hash: string): Promise<RefreshToken | null>;
    findByUserId(userId: UserId): Promise<RefreshToken[]>;
    save(token: RefreshToken): Promise<RefreshToken>;
    delete(id: string): Promise<void>;
    deleteAllByUserId(userId: UserId): Promise<void>;
    deleteExpiredAndRevoked(): Promise<number>;
}
