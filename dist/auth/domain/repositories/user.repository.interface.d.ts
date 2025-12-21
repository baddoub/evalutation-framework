import { User } from '../entities/user.entity';
import { Email } from '../value-objects/email.vo';
import { UserId } from '../value-objects/user-id.vo';
import { Role } from '../value-objects/role.vo';
export interface IUserRepository {
    findById(id: UserId): Promise<User | null>;
    findByEmail(email: Email): Promise<User | null>;
    findByKeycloakId(keycloakId: string): Promise<User | null>;
    save(user: User): Promise<User>;
    delete(id: UserId): Promise<void>;
    existsByEmail(email: Email): Promise<boolean>;
    findByRole(role: Role): Promise<User[]>;
    findByManagerId(managerId: string): Promise<User[]>;
}
