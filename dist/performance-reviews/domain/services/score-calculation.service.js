"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoreCalculationService = void 0;
const weighted_score_vo_1 = require("../value-objects/weighted-score.vo");
class ScoreCalculationService {
    calculateWeightedScore(pillarScores, level) {
        const weights = this.getWeightsForLevel(level);
        const weighted = pillarScores.projectImpact.value * weights.projectImpact +
            pillarScores.direction.value * weights.direction +
            pillarScores.engineeringExcellence.value * weights.engineeringExcellence +
            pillarScores.operationalOwnership.value * weights.operationalOwnership +
            pillarScores.peopleImpact.value * weights.peopleImpact;
        return weighted_score_vo_1.WeightedScore.fromValue(weighted);
    }
    getWeightsForLevel(level) {
        const weights = ScoreCalculationService.WEIGHTS_BY_LEVEL[level.value];
        if (!weights) {
            throw new Error(`No weights defined for level: ${level.value}`);
        }
        return weights;
    }
    static getAllWeights() {
        return { ...ScoreCalculationService.WEIGHTS_BY_LEVEL };
    }
}
exports.ScoreCalculationService = ScoreCalculationService;
ScoreCalculationService.WEIGHTS_BY_LEVEL = {
    JUNIOR: {
        projectImpact: 0.20,
        direction: 0.10,
        engineeringExcellence: 0.25,
        operationalOwnership: 0.20,
        peopleImpact: 0.25,
    },
    MID: {
        projectImpact: 0.25,
        direction: 0.15,
        engineeringExcellence: 0.25,
        operationalOwnership: 0.20,
        peopleImpact: 0.15,
    },
    SENIOR: {
        projectImpact: 0.30,
        direction: 0.20,
        engineeringExcellence: 0.20,
        operationalOwnership: 0.15,
        peopleImpact: 0.15,
    },
    LEAD: {
        projectImpact: 0.30,
        direction: 0.25,
        engineeringExcellence: 0.20,
        operationalOwnership: 0.15,
        peopleImpact: 0.10,
    },
    MANAGER: {
        projectImpact: 0.35,
        direction: 0.25,
        engineeringExcellence: 0.15,
        operationalOwnership: 0.10,
        peopleImpact: 0.15,
    },
};
//# sourceMappingURL=score-calculation.service.js.map