export declare class EngineerLevel {
    private static readonly VALID_LEVELS;
    private readonly _value;
    private constructor();
    static readonly JUNIOR: EngineerLevel;
    static readonly MID: EngineerLevel;
    static readonly SENIOR: EngineerLevel;
    static readonly LEAD: EngineerLevel;
    static readonly MANAGER: EngineerLevel;
    static fromString(level: string): EngineerLevel;
    static create(level: string): EngineerLevel;
    private static isValid;
    get value(): string;
    equals(other: EngineerLevel): boolean;
    isJunior(): boolean;
    isMid(): boolean;
    isSenior(): boolean;
    isLead(): boolean;
    isManager(): boolean;
    toString(): string;
}
