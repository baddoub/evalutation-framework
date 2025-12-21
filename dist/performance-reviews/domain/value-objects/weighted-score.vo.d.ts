import { BonusTier } from './bonus-tier.vo';
export declare class WeightedScore {
    private readonly _value;
    private constructor();
    static fromValue(value: number): WeightedScore;
    get value(): number;
    get percentage(): number;
    get bonusTier(): BonusTier;
    equals(other: WeightedScore): boolean;
    toString(): string;
}
