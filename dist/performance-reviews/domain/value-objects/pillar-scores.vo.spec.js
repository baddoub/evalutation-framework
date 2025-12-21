"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pillar_scores_vo_1 = require("./pillar-scores.vo");
const pillar_score_vo_1 = require("./pillar-score.vo");
describe('PillarScores', () => {
    describe('create', () => {
        it('should create PillarScores with valid scores', () => {
            const scores = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 3,
                direction: 2,
                engineeringExcellence: 4,
                operationalOwnership: 3,
                peopleImpact: 2,
            });
            expect(scores).toBeInstanceOf(pillar_scores_vo_1.PillarScores);
            expect(scores.projectImpact.value).toBe(3);
            expect(scores.direction.value).toBe(2);
            expect(scores.engineeringExcellence.value).toBe(4);
            expect(scores.operationalOwnership.value).toBe(3);
            expect(scores.peopleImpact.value).toBe(2);
        });
        it('should create PillarScores with all zeros', () => {
            const scores = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 0,
                direction: 0,
                engineeringExcellence: 0,
                operationalOwnership: 0,
                peopleImpact: 0,
            });
            expect(scores.projectImpact.value).toBe(0);
            expect(scores.direction.value).toBe(0);
            expect(scores.engineeringExcellence.value).toBe(0);
            expect(scores.operationalOwnership.value).toBe(0);
            expect(scores.peopleImpact.value).toBe(0);
        });
        it('should create PillarScores with all max values', () => {
            const scores = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 4,
                direction: 4,
                engineeringExcellence: 4,
                operationalOwnership: 4,
                peopleImpact: 4,
            });
            expect(scores.projectImpact.value).toBe(4);
            expect(scores.direction.value).toBe(4);
            expect(scores.engineeringExcellence.value).toBe(4);
            expect(scores.operationalOwnership.value).toBe(4);
            expect(scores.peopleImpact.value).toBe(4);
        });
        it('should throw error when any score is invalid', () => {
            expect(() => pillar_scores_vo_1.PillarScores.create({
                projectImpact: 5,
                direction: 2,
                engineeringExcellence: 3,
                operationalOwnership: 2,
                peopleImpact: 3,
            })).toThrow();
            expect(() => pillar_scores_vo_1.PillarScores.create({
                projectImpact: 2,
                direction: -1,
                engineeringExcellence: 3,
                operationalOwnership: 2,
                peopleImpact: 3,
            })).toThrow();
        });
    });
    describe('toObject', () => {
        it('should return plain object representation', () => {
            const scores = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 3,
                direction: 2,
                engineeringExcellence: 4,
                operationalOwnership: 3,
                peopleImpact: 2,
            });
            const obj = scores.toObject();
            expect(obj).toEqual({
                projectImpact: 3,
                direction: 2,
                engineeringExcellence: 4,
                operationalOwnership: 3,
                peopleImpact: 2,
            });
        });
    });
    describe('equals', () => {
        it('should return true for equal PillarScores', () => {
            const scores1 = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 3,
                direction: 2,
                engineeringExcellence: 4,
                operationalOwnership: 3,
                peopleImpact: 2,
            });
            const scores2 = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 3,
                direction: 2,
                engineeringExcellence: 4,
                operationalOwnership: 3,
                peopleImpact: 2,
            });
            expect(scores1.equals(scores2)).toBe(true);
        });
        it('should return false for different PillarScores', () => {
            const scores1 = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 3,
                direction: 2,
                engineeringExcellence: 4,
                operationalOwnership: 3,
                peopleImpact: 2,
            });
            const scores2 = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 2,
                direction: 2,
                engineeringExcellence: 4,
                operationalOwnership: 3,
                peopleImpact: 2,
            });
            expect(scores1.equals(scores2)).toBe(false);
        });
        it('should return false for null/undefined', () => {
            const scores = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 3,
                direction: 2,
                engineeringExcellence: 4,
                operationalOwnership: 3,
                peopleImpact: 2,
            });
            expect(scores.equals(null)).toBe(false);
            expect(scores.equals(undefined)).toBe(false);
        });
    });
    describe('getters', () => {
        it('should expose all pillar scores', () => {
            const scores = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 3,
                direction: 2,
                engineeringExcellence: 4,
                operationalOwnership: 3,
                peopleImpact: 2,
            });
            expect(scores.projectImpact).toBeInstanceOf(pillar_score_vo_1.PillarScore);
            expect(scores.direction).toBeInstanceOf(pillar_score_vo_1.PillarScore);
            expect(scores.engineeringExcellence).toBeInstanceOf(pillar_score_vo_1.PillarScore);
            expect(scores.operationalOwnership).toBeInstanceOf(pillar_score_vo_1.PillarScore);
            expect(scores.peopleImpact).toBeInstanceOf(pillar_score_vo_1.PillarScore);
        });
    });
});
//# sourceMappingURL=pillar-scores.vo.spec.js.map