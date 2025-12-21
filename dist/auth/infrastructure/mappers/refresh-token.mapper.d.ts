import { RefreshToken as PrismaRefreshToken } from '@prisma/client';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
export declare class RefreshTokenMapper {
    static toDomain(prismaToken: PrismaRefreshToken): RefreshToken;
    static toOrm(domainToken: RefreshToken): PrismaRefreshToken;
    static toOrmData(domainToken: RefreshToken): Omit<PrismaRefreshToken, 'id'>;
}
