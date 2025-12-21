"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BonusTier = void 0;
class BonusTier {
    constructor(value) {
        this._value = value;
    }
    static fromPercentage(percentage) {
        if (percentage >= this.EXCEEDS_THRESHOLD) {
            return BonusTier.EXCEEDS;
        }
        if (percentage >= this.MEETS_THRESHOLD) {
            return BonusTier.MEETS;
        }
        return BonusTier.BELOW;
    }
    get value() {
        return this._value;
    }
    equals(other) {
        if (!other) {
            return false;
        }
        return this._value === other._value;
    }
    isExceeds() {
        return this._value === 'EXCEEDS';
    }
    isMeets() {
        return this._value === 'MEETS';
    }
    isBelow() {
        return this._value === 'BELOW';
    }
    toString() {
        return this._value;
    }
}
exports.BonusTier = BonusTier;
BonusTier.EXCEEDS_THRESHOLD = 85;
BonusTier.MEETS_THRESHOLD = 50;
BonusTier.EXCEEDS = new BonusTier('EXCEEDS');
BonusTier.MEETS = new BonusTier('MEETS');
BonusTier.BELOW = new BonusTier('BELOW');
//# sourceMappingURL=bonus-tier.vo.js.map