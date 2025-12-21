export declare class CalibrationSessionId {
    private readonly _value;
    private constructor();
    get value(): string;
    static create(value?: string): CalibrationSessionId;
    static fromString(value: string): CalibrationSessionId;
    equals(other: CalibrationSessionId): boolean;
    toString(): string;
}
