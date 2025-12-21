import { User } from '../../domain/entities/user.entity';
export declare class UserDto {
    readonly id: string;
    readonly email: string;
    readonly name: string;
    readonly keycloakId: string;
    readonly roles: string[];
    readonly isActive: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    constructor(id: string, email: string, name: string, keycloakId: string, roles: string[], isActive: boolean, createdAt: Date, updatedAt: Date);
    static fromDomain(user: User): UserDto;
}
