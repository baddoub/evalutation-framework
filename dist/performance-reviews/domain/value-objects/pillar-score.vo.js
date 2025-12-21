"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PillarScore = void 0;
const invalid_pillar_score_exception_1 = require("../exceptions/invalid-pillar-score.exception");
class PillarScore {
    constructor(value) {
        if (!Number.isInteger(value)) {
            throw new invalid_pillar_score_exception_1.InvalidPillarScoreException(`Pillar score must be an integer, got ${value}`);
        }
        if (value < 0 || value > 4) {
            throw new invalid_pillar_score_exception_1.InvalidPillarScoreException(`Pillar score must be between 0 and 4, got ${value}`);
        }
        this._value = value;
    }
    static fromValue(value) {
        return new PillarScore(value);
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
    toString() {
        return this._value.toString();
    }
}
exports.PillarScore = PillarScore;
//# sourceMappingURL=pillar-score.vo.js.map