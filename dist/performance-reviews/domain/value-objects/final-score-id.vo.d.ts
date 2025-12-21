export declare class FinalScoreId {
    private readonly _value;
    private constructor();
    get value(): string;
    static generate(): FinalScoreId;
    static fromString(value: string): FinalScoreId;
    static create(value?: string): FinalScoreId;
    equals(other: FinalScoreId): boolean;
    toString(): string;
}
