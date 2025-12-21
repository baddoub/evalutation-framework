export declare class Role {
    private static readonly VALID_ROLES;
    private readonly _value;
    private constructor();
    static create(role: string): Role;
    static admin(): Role;
    static manager(): Role;
    static user(): Role;
    private static isValid;
    get value(): string;
    equals(other: Role): boolean;
    isAdmin(): boolean;
    toString(): string;
}
