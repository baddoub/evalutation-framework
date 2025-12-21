import { Session as PrismaSession } from '@prisma/client';
import { Session } from '../../domain/entities/session.entity';
export declare class SessionMapper {
    static toDomain(prismaSession: PrismaSession): Session;
    static toOrm(domainSession: Session): PrismaSession;
    static toOrmData(domainSession: Session): Omit<PrismaSession, 'id'>;
}
