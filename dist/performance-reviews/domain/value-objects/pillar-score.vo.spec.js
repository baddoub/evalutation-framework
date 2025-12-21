"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pillar_score_vo_1 = require("./pillar-score.vo");
const exceptions_1 = require("../exceptions");
describe('PillarScore', () => {
    describe('fromValue', () => {
        it('should create PillarScore with value 0', () => {
            const score = pillar_score_vo_1.PillarScore.fromValue(0);
            expect(score).toBeInstanceOf(pillar_score_vo_1.PillarScore);
            expect(score.value).toBe(0);
        });
        it('should create PillarScore with value 1', () => {
            const score = pillar_score_vo_1.PillarScore.fromValue(1);
            expect(score.value).toBe(1);
        });
        it('should create PillarScore with value 2', () => {
            const score = pillar_score_vo_1.PillarScore.fromValue(2);
            expect(score.value).toBe(2);
        });
        it('should create PillarScore with value 3', () => {
            const score = pillar_score_vo_1.PillarScore.fromValue(3);
            expect(score.value).toBe(3);
        });
        it('should create PillarScore with value 4', () => {
            const score = pillar_score_vo_1.PillarScore.fromValue(4);
            expect(score.value).toBe(4);
        });
        it('should throw InvalidPillarScoreException for negative values', () => {
            expect(() => pillar_score_vo_1.PillarScore.fromValue(-1)).toThrow(exceptions_1.InvalidPillarScoreException);
            expect(() => pillar_score_vo_1.PillarScore.fromValue(-10)).toThrow(exceptions_1.InvalidPillarScoreException);
        });
        it('should throw InvalidPillarScoreException for values greater than 4', () => {
            expect(() => pillar_score_vo_1.PillarScore.fromValue(5)).toThrow(exceptions_1.InvalidPillarScoreException);
            expect(() => pillar_score_vo_1.PillarScore.fromValue(10)).toThrow(exceptions_1.InvalidPillarScoreException);
        });
        it('should throw InvalidPillarScoreException for non-integer values', () => {
            expect(() => pillar_score_vo_1.PillarScore.fromValue(2.5)).toThrow(exceptions_1.InvalidPillarScoreException);
            expect(() => pillar_score_vo_1.PillarScore.fromValue(3.14)).toThrow(exceptions_1.InvalidPillarScoreException);
        });
        it('should throw InvalidPillarScoreException for null/undefined', () => {
            expect(() => pillar_score_vo_1.PillarScore.fromValue(null)).toThrow(exceptions_1.InvalidPillarScoreException);
            expect(() => pillar_score_vo_1.PillarScore.fromValue(undefined)).toThrow(exceptions_1.InvalidPillarScoreException);
        });
        it('should throw InvalidPillarScoreException for NaN', () => {
            expect(() => pillar_score_vo_1.PillarScore.fromValue(NaN)).toThrow(exceptions_1.InvalidPillarScoreException);
        });
    });
    describe('equals', () => {
        it('should return true for equal scores', () => {
            const score1 = pillar_score_vo_1.PillarScore.fromValue(3);
            const score2 = pillar_score_vo_1.PillarScore.fromValue(3);
            expect(score1.equals(score2)).toBe(true);
        });
        it('should return false for different scores', () => {
            const score1 = pillar_score_vo_1.PillarScore.fromValue(2);
            const score2 = pillar_score_vo_1.PillarScore.fromValue(3);
            expect(score1.equals(score2)).toBe(false);
        });
        it('should return false for null/undefined', () => {
            const score = pillar_score_vo_1.PillarScore.fromValue(2);
            expect(score.equals(null)).toBe(false);
            expect(score.equals(undefined)).toBe(false);
        });
    });
    describe('value getter', () => {
        it('should return the score value', () => {
            const score = pillar_score_vo_1.PillarScore.fromValue(3);
            expect(score.value).toBe(3);
        });
    });
    describe('toString', () => {
        it('should return the score as string', () => {
            const score = pillar_score_vo_1.PillarScore.fromValue(3);
            expect(score.toString()).toBe('3');
        });
    });
});
//# sourceMappingURL=pillar-score.vo.spec.js.map