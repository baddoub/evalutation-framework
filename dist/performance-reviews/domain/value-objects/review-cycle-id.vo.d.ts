export declare class ReviewCycleId {
    private readonly _value;
    private constructor();
    static generate(): ReviewCycleId;
    static fromString(id: string): ReviewCycleId;
    static create(id: string): ReviewCycleId;
    private static isValid;
    get value(): string;
    equals(other: ReviewCycleId): boolean;
    toString(): string;
}
