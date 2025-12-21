export declare class Email {
    private readonly _value;
    private constructor();
    static create(email: string): Email;
    private static isValid;
    get value(): string;
    equals(other: Email): boolean;
    toString(): string;
}
