export declare class BonusTier {
    private static readonly EXCEEDS_THRESHOLD;
    private static readonly MEETS_THRESHOLD;
    private readonly _value;
    private constructor();
    static readonly EXCEEDS: BonusTier;
    static readonly MEETS: BonusTier;
    static readonly BELOW: BonusTier;
    static fromPercentage(percentage: number): BonusTier;
    get value(): string;
    equals(other: BonusTier): boolean;
    isExceeds(): boolean;
    isMeets(): boolean;
    isBelow(): boolean;
    toString(): string;
}
