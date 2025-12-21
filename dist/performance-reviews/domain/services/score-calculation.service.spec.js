"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const score_calculation_service_1 = require("./score-calculation.service");
const pillar_scores_vo_1 = require("../value-objects/pillar-scores.vo");
const engineer_level_vo_1 = require("../value-objects/engineer-level.vo");
const weighted_score_vo_1 = require("../value-objects/weighted-score.vo");
describe('ScoreCalculationService', () => {
    let service;
    beforeEach(() => {
        service = new score_calculation_service_1.ScoreCalculationService();
    });
    describe('calculateWeightedScore', () => {
        describe('JUNIOR level', () => {
            it('should calculate weighted score for JUNIOR engineer', () => {
                const scores = pillar_scores_vo_1.PillarScores.create({
                    projectImpact: 3,
                    direction: 2,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                });
                const level = engineer_level_vo_1.EngineerLevel.fromString('JUNIOR');
                const result = service.calculateWeightedScore(scores, level);
                expect(result).toBeInstanceOf(weighted_score_vo_1.WeightedScore);
                expect(result.value).toBeCloseTo(2.9, 2);
            });
            it('should handle all zeros for JUNIOR', () => {
                const scores = pillar_scores_vo_1.PillarScores.create({
                    projectImpact: 0,
                    direction: 0,
                    engineeringExcellence: 0,
                    operationalOwnership: 0,
                    peopleImpact: 0,
                });
                const level = engineer_level_vo_1.EngineerLevel.fromString('JUNIOR');
                const result = service.calculateWeightedScore(scores, level);
                expect(result.value).toBe(0);
            });
            it('should handle all max scores for JUNIOR', () => {
                const scores = pillar_scores_vo_1.PillarScores.create({
                    projectImpact: 4,
                    direction: 4,
                    engineeringExcellence: 4,
                    operationalOwnership: 4,
                    peopleImpact: 4,
                });
                const level = engineer_level_vo_1.EngineerLevel.fromString('JUNIOR');
                const result = service.calculateWeightedScore(scores, level);
                expect(result.value).toBe(4);
            });
        });
        describe('MID level', () => {
            it('should calculate weighted score for MID engineer', () => {
                const scores = pillar_scores_vo_1.PillarScores.create({
                    projectImpact: 3,
                    direction: 2,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                });
                const level = engineer_level_vo_1.EngineerLevel.fromString('MID');
                const result = service.calculateWeightedScore(scores, level);
                expect(result.value).toBeCloseTo(2.95, 2);
            });
            it('should handle all max scores for MID', () => {
                const scores = pillar_scores_vo_1.PillarScores.create({
                    projectImpact: 4,
                    direction: 4,
                    engineeringExcellence: 4,
                    operationalOwnership: 4,
                    peopleImpact: 4,
                });
                const level = engineer_level_vo_1.EngineerLevel.fromString('MID');
                const result = service.calculateWeightedScore(scores, level);
                expect(result.value).toBe(4);
            });
        });
        describe('SENIOR level', () => {
            it('should calculate weighted score for SENIOR engineer', () => {
                const scores = pillar_scores_vo_1.PillarScores.create({
                    projectImpact: 3,
                    direction: 2,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                });
                const level = engineer_level_vo_1.EngineerLevel.fromString('SENIOR');
                const result = service.calculateWeightedScore(scores, level);
                expect(result.value).toBeCloseTo(2.85, 2);
            });
            it('should weight projectImpact heavily for SENIOR', () => {
                const scores = pillar_scores_vo_1.PillarScores.create({
                    projectImpact: 4,
                    direction: 0,
                    engineeringExcellence: 0,
                    operationalOwnership: 0,
                    peopleImpact: 0,
                });
                const level = engineer_level_vo_1.EngineerLevel.fromString('SENIOR');
                const result = service.calculateWeightedScore(scores, level);
                expect(result.value).toBeCloseTo(1.2, 2);
            });
        });
        describe('LEAD level', () => {
            it('should calculate weighted score for LEAD engineer', () => {
                const scores = pillar_scores_vo_1.PillarScores.create({
                    projectImpact: 3,
                    direction: 2,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                });
                const level = engineer_level_vo_1.EngineerLevel.fromString('LEAD');
                const result = service.calculateWeightedScore(scores, level);
                expect(result.value).toBeCloseTo(2.85, 2);
            });
            it('should weight direction heavily for LEAD', () => {
                const scores = pillar_scores_vo_1.PillarScores.create({
                    projectImpact: 0,
                    direction: 4,
                    engineeringExcellence: 0,
                    operationalOwnership: 0,
                    peopleImpact: 0,
                });
                const level = engineer_level_vo_1.EngineerLevel.fromString('LEAD');
                const result = service.calculateWeightedScore(scores, level);
                expect(result.value).toBeCloseTo(1.0, 2);
            });
        });
        describe('MANAGER level', () => {
            it('should calculate weighted score for MANAGER', () => {
                const scores = pillar_scores_vo_1.PillarScores.create({
                    projectImpact: 3,
                    direction: 2,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                });
                const level = engineer_level_vo_1.EngineerLevel.fromString('MANAGER');
                const result = service.calculateWeightedScore(scores, level);
                expect(result.value).toBeCloseTo(2.75, 2);
            });
            it('should weight projectImpact most heavily for MANAGER (35%)', () => {
                const scores = pillar_scores_vo_1.PillarScores.create({
                    projectImpact: 4,
                    direction: 0,
                    engineeringExcellence: 0,
                    operationalOwnership: 0,
                    peopleImpact: 0,
                });
                const level = engineer_level_vo_1.EngineerLevel.fromString('MANAGER');
                const result = service.calculateWeightedScore(scores, level);
                expect(result.value).toBeCloseTo(1.4, 2);
            });
            it('should handle all max scores for MANAGER', () => {
                const scores = pillar_scores_vo_1.PillarScores.create({
                    projectImpact: 4,
                    direction: 4,
                    engineeringExcellence: 4,
                    operationalOwnership: 4,
                    peopleImpact: 4,
                });
                const level = engineer_level_vo_1.EngineerLevel.fromString('MANAGER');
                const result = service.calculateWeightedScore(scores, level);
                expect(result.value).toBe(4);
            });
        });
        describe('error cases', () => {
            it('should throw error for invalid level', () => {
                const scores = pillar_scores_vo_1.PillarScores.create({
                    projectImpact: 3,
                    direction: 2,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                });
                const invalidLevel = { value: 'INVALID_LEVEL' };
                expect(() => service.calculateWeightedScore(scores, invalidLevel)).toThrow('No weights defined for level: INVALID_LEVEL');
            });
        });
    });
    describe('getAllWeights', () => {
        it('should return all level weights', () => {
            const weights = score_calculation_service_1.ScoreCalculationService.getAllWeights();
            expect(weights).toHaveProperty('JUNIOR');
            expect(weights).toHaveProperty('MID');
            expect(weights).toHaveProperty('SENIOR');
            expect(weights).toHaveProperty('LEAD');
            expect(weights).toHaveProperty('MANAGER');
        });
        it('should return a copy of weights (not reference)', () => {
            const weights1 = score_calculation_service_1.ScoreCalculationService.getAllWeights();
            const weights2 = score_calculation_service_1.ScoreCalculationService.getAllWeights();
            expect(weights1).not.toBe(weights2);
            expect(weights1).toEqual(weights2);
        });
        describe('weight validation', () => {
            it('should have weights that sum to 1.0 for JUNIOR', () => {
                const weights = score_calculation_service_1.ScoreCalculationService.getAllWeights().JUNIOR;
                const sum = weights.projectImpact +
                    weights.direction +
                    weights.engineeringExcellence +
                    weights.operationalOwnership +
                    weights.peopleImpact;
                expect(sum).toBeCloseTo(1.0, 10);
            });
            it('should have weights that sum to 1.0 for MID', () => {
                const weights = score_calculation_service_1.ScoreCalculationService.getAllWeights().MID;
                const sum = weights.projectImpact +
                    weights.direction +
                    weights.engineeringExcellence +
                    weights.operationalOwnership +
                    weights.peopleImpact;
                expect(sum).toBeCloseTo(1.0, 10);
            });
            it('should have weights that sum to 1.0 for SENIOR', () => {
                const weights = score_calculation_service_1.ScoreCalculationService.getAllWeights().SENIOR;
                const sum = weights.projectImpact +
                    weights.direction +
                    weights.engineeringExcellence +
                    weights.operationalOwnership +
                    weights.peopleImpact;
                expect(sum).toBeCloseTo(1.0, 10);
            });
            it('should have weights that sum to 1.0 for LEAD', () => {
                const weights = score_calculation_service_1.ScoreCalculationService.getAllWeights().LEAD;
                const sum = weights.projectImpact +
                    weights.direction +
                    weights.engineeringExcellence +
                    weights.operationalOwnership +
                    weights.peopleImpact;
                expect(sum).toBeCloseTo(1.0, 10);
            });
            it('should have weights that sum to 1.0 for MANAGER', () => {
                const weights = score_calculation_service_1.ScoreCalculationService.getAllWeights().MANAGER;
                const sum = weights.projectImpact +
                    weights.direction +
                    weights.engineeringExcellence +
                    weights.operationalOwnership +
                    weights.peopleImpact;
                expect(sum).toBeCloseTo(1.0, 10);
            });
            it('should verify MANAGER weights match spec (35% projectImpact)', () => {
                const weights = score_calculation_service_1.ScoreCalculationService.getAllWeights().MANAGER;
                expect(weights.projectImpact).toBe(0.35);
                expect(weights.direction).toBe(0.25);
                expect(weights.engineeringExcellence).toBe(0.15);
                expect(weights.operationalOwnership).toBe(0.10);
                expect(weights.peopleImpact).toBe(0.15);
            });
        });
    });
    describe('cross-level comparisons', () => {
        it('should produce different weighted scores for same pillar scores across levels', () => {
            const scores = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 3,
                direction: 2,
                engineeringExcellence: 4,
                operationalOwnership: 3,
                peopleImpact: 2,
            });
            const juniorScore = service.calculateWeightedScore(scores, engineer_level_vo_1.EngineerLevel.fromString('JUNIOR'));
            const midScore = service.calculateWeightedScore(scores, engineer_level_vo_1.EngineerLevel.fromString('MID'));
            const seniorScore = service.calculateWeightedScore(scores, engineer_level_vo_1.EngineerLevel.fromString('SENIOR'));
            const leadScore = service.calculateWeightedScore(scores, engineer_level_vo_1.EngineerLevel.fromString('LEAD'));
            const managerScore = service.calculateWeightedScore(scores, engineer_level_vo_1.EngineerLevel.fromString('MANAGER'));
            const scoreValues = [
                juniorScore.value,
                midScore.value,
                seniorScore.value,
                leadScore.value,
                managerScore.value,
            ];
            const uniqueScores = new Set(scoreValues);
            expect(uniqueScores.size).toBeGreaterThan(1);
        });
        it('should always produce same result for all 4s regardless of level', () => {
            const perfectScores = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 4,
                direction: 4,
                engineeringExcellence: 4,
                operationalOwnership: 4,
                peopleImpact: 4,
            });
            const levels = ['JUNIOR', 'MID', 'SENIOR', 'LEAD', 'MANAGER'];
            levels.forEach((levelStr) => {
                const level = engineer_level_vo_1.EngineerLevel.fromString(levelStr);
                const result = service.calculateWeightedScore(perfectScores, level);
                expect(result.value).toBe(4);
            });
        });
        it('should always produce zero for all zeros regardless of level', () => {
            const zeroScores = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 0,
                direction: 0,
                engineeringExcellence: 0,
                operationalOwnership: 0,
                peopleImpact: 0,
            });
            const levels = ['JUNIOR', 'MID', 'SENIOR', 'LEAD', 'MANAGER'];
            levels.forEach((levelStr) => {
                const level = engineer_level_vo_1.EngineerLevel.fromString(levelStr);
                const result = service.calculateWeightedScore(zeroScores, level);
                expect(result.value).toBe(0);
            });
        });
    });
    describe('edge cases', () => {
        it('should handle fractional scores correctly', () => {
            const scores = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 1,
                direction: 1,
                engineeringExcellence: 1,
                operationalOwnership: 1,
                peopleImpact: 1,
            });
            const level = engineer_level_vo_1.EngineerLevel.fromString('JUNIOR');
            const result = service.calculateWeightedScore(scores, level);
            expect(result.value).toBeCloseTo(1.0, 2);
        });
        it('should handle mixed scores correctly', () => {
            const scores = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 4,
                direction: 0,
                engineeringExcellence: 4,
                operationalOwnership: 0,
                peopleImpact: 4,
            });
            const level = engineer_level_vo_1.EngineerLevel.fromString('JUNIOR');
            const result = service.calculateWeightedScore(scores, level);
            expect(result.value).toBeCloseTo(2.8, 2);
        });
    });
});
//# sourceMappingURL=score-calculation.service.spec.js.map