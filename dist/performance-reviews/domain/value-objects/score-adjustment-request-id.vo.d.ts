export declare class ScoreAdjustmentRequestId {
    private readonly _value;
    private constructor();
    get value(): string;
    static generate(): ScoreAdjustmentRequestId;
    static fromString(value: string): ScoreAdjustmentRequestId;
    static create(value?: string): ScoreAdjustmentRequestId;
    equals(other: ScoreAdjustmentRequestId): boolean;
    toString(): string;
}
