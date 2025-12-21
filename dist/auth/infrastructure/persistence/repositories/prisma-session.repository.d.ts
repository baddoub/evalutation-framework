import { ISessionRepository } from '../../../domain/repositories/session.repository.interface';
import { Session } from '../../../domain/entities/session.entity';
import { UserId } from '../../../domain/value-objects/user-id.vo';
import { PrismaService } from '../prisma/prisma.service';
export declare class PrismaSessionRepository implements ISessionRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<Session | null>;
    findByUserId(userId: UserId): Promise<Session[]>;
    save(session: Session): Promise<Session>;
    findActiveByUserId(userId: UserId): Promise<Session[]>;
    delete(id: string): Promise<void>;
    deleteAllByUserId(userId: UserId): Promise<void>;
    deleteExpired(): Promise<number>;
}
