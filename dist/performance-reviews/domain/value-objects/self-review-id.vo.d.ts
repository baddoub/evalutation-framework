export declare class SelfReviewId {
    private readonly _value;
    private constructor();
    static generate(): SelfReviewId;
    static fromString(id: string): SelfReviewId;
    get value(): string;
    equals(other: SelfReviewId): boolean;
}
