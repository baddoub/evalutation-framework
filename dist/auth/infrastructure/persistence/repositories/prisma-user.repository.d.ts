import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { User } from '../../../domain/entities/user.entity';
import { Email } from '../../../domain/value-objects/email.vo';
import { UserId } from '../../../domain/value-objects/user-id.vo';
import { Role } from '../../../domain/value-objects/role.vo';
import { PrismaService } from '../prisma/prisma.service';
export declare class PrismaUserRepository implements IUserRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(id: UserId): Promise<User | null>;
    findByEmail(email: Email): Promise<User | null>;
    findByKeycloakId(keycloakId: string): Promise<User | null>;
    save(user: User): Promise<User>;
    delete(id: UserId): Promise<void>;
    existsByEmail(email: Email): Promise<boolean>;
    findByRole(role: Role): Promise<User[]>;
    findByManagerId(managerId: string): Promise<User[]>;
}
