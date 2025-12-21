"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeightedScore = void 0;
const invalid_weighted_score_exception_1 = require("../exceptions/invalid-weighted-score.exception");
const bonus_tier_vo_1 = require("./bonus-tier.vo");
class WeightedScore {
    constructor(value) {
        if (value === null || value === undefined || Number.isNaN(value)) {
            throw new invalid_weighted_score_exception_1.InvalidWeightedScoreException(`Weighted score must be a valid number, got ${value}`);
        }
        if (value < 0 || value > 4) {
            throw new invalid_weighted_score_exception_1.InvalidWeightedScoreException(`Weighted score must be between 0 and 4, got ${value}`);
        }
        this._value = value;
    }
    static fromValue(value) {
        return new WeightedScore(value);
    }
    get value() {
        return this._value;
    }
    get percentage() {
        return (this._value / 4.0) * 100;
    }
    get bonusTier() {
        return bonus_tier_vo_1.BonusTier.fromPercentage(this.percentage);
    }
    equals(other) {
        if (!other) {
            return false;
        }
        return this._value === other._value;
    }
    toString() {
        return this._value.toString();
    }
}
exports.WeightedScore = WeightedScore;
//# sourceMappingURL=weighted-score.vo.js.map