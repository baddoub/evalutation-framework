import { Email } from '../value-objects/email.vo';
import { UserId } from '../value-objects/user-id.vo';
import { Role } from '../value-objects/role.vo';
export interface UserProps {
    id: UserId;
    email: Email;
    name: string;
    keycloakId: string;
    roles: Role[];
    isActive: boolean;
    level?: string | null;
    department?: string | null;
    jobTitle?: string | null;
    managerId?: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
export interface KeycloakUserData {
    email: Email;
    name: string;
    roles: Role[];
}
export declare class User {
    private readonly _id;
    private _email;
    private _name;
    private readonly _keycloakId;
    private _roles;
    private _isActive;
    private _level?;
    private _department?;
    private _jobTitle?;
    private _managerId?;
    private readonly _createdAt;
    private _updatedAt;
    private _deletedAt?;
    private constructor();
    static create(props: UserProps): User;
    updateProfile(name: string): void;
    assignRole(role: Role): void;
    removeRole(role: Role): void;
    activate(): void;
    deactivate(): void;
    hasRole(role: Role): boolean;
    hasAnyRole(roles: Role[]): boolean;
    synchronizeFromKeycloak(data: KeycloakUserData): void;
    private touch;
    private static validateName;
    get id(): UserId;
    get email(): Email;
    get name(): string;
    get keycloakId(): string;
    get roles(): Role[];
    get isActive(): boolean;
    get createdAt(): Date;
    get updatedAt(): Date;
    get deletedAt(): Date | undefined;
    get level(): string | null | undefined;
    get department(): string | null | undefined;
    get jobTitle(): string | null | undefined;
    get managerId(): string | null | undefined;
}
