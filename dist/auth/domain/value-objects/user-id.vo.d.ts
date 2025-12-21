export declare class UserId {
    private readonly _value;
    private constructor();
    static generate(): UserId;
    static fromString(id: string): UserId;
    private static isValid;
    get value(): string;
    equals(other: UserId): boolean;
    toString(): string;
}
