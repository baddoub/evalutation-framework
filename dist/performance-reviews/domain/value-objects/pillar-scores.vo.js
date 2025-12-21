"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PillarScores = void 0;
const pillar_score_vo_1 = require("./pillar-score.vo");
class PillarScores {
    constructor(_projectImpact, _direction, _engineeringExcellence, _operationalOwnership, _peopleImpact) {
        this._projectImpact = _projectImpact;
        this._direction = _direction;
        this._engineeringExcellence = _engineeringExcellence;
        this._operationalOwnership = _operationalOwnership;
        this._peopleImpact = _peopleImpact;
    }
    static create(scores) {
        return new PillarScores(pillar_score_vo_1.PillarScore.fromValue(scores.projectImpact), pillar_score_vo_1.PillarScore.fromValue(scores.direction), pillar_score_vo_1.PillarScore.fromValue(scores.engineeringExcellence), pillar_score_vo_1.PillarScore.fromValue(scores.operationalOwnership), pillar_score_vo_1.PillarScore.fromValue(scores.peopleImpact));
    }
    get projectImpact() {
        return this._projectImpact;
    }
    get direction() {
        return this._direction;
    }
    get engineeringExcellence() {
        return this._engineeringExcellence;
    }
    get operationalOwnership() {
        return this._operationalOwnership;
    }
    get peopleImpact() {
        return this._peopleImpact;
    }
    toObject() {
        return {
            projectImpact: this._projectImpact.value,
            direction: this._direction.value,
            engineeringExcellence: this._engineeringExcellence.value,
            operationalOwnership: this._operationalOwnership.value,
            peopleImpact: this._peopleImpact.value,
        };
    }
    toPlainObject() {
        return this.toObject();
    }
    equals(other) {
        if (!other) {
            return false;
        }
        return (this._projectImpact.equals(other._projectImpact) &&
            this._direction.equals(other._direction) &&
            this._engineeringExcellence.equals(other._engineeringExcellence) &&
            this._operationalOwnership.equals(other._operationalOwnership) &&
            this._peopleImpact.equals(other._peopleImpact));
    }
}
exports.PillarScores = PillarScores;
//# sourceMappingURL=pillar-scores.vo.js.map