export declare class PillarScore {
    private readonly _value;
    private constructor();
    static fromValue(value: number): PillarScore;
    get value(): number;
    equals(other: PillarScore): boolean;
    toString(): string;
}
