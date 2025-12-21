import { User as PrismaUser } from '@prisma/client';
import { User } from '../../domain/entities/user.entity';
export declare class UserMapper {
    static toDomain(prismaUser: PrismaUser): User;
    static toOrm(domainUser: User): PrismaUser;
    static toOrmData(domainUser: User): Omit<PrismaUser, 'id'>;
}
