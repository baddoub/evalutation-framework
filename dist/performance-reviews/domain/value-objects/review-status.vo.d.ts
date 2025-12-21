export declare class ReviewStatus {
    private readonly _value;
    private constructor();
    static readonly DRAFT: ReviewStatus;
    static readonly SUBMITTED: ReviewStatus;
    static readonly CALIBRATED: ReviewStatus;
    static fromString(status: string): ReviewStatus;
    get value(): string;
    equals(other: ReviewStatus): boolean;
    toString(): string;
}
