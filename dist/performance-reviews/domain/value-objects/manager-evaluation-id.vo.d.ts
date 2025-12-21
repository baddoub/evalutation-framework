export declare class ManagerEvaluationId {
    private readonly _value;
    private constructor();
    get value(): string;
    static create(value?: string): ManagerEvaluationId;
    static fromString(value: string): ManagerEvaluationId;
    static generate(): ManagerEvaluationId;
    equals(other: ManagerEvaluationId): boolean;
    toString(): string;
}
