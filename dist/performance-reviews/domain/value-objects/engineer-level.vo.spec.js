"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const engineer_level_vo_1 = require("./engineer-level.vo");
const exceptions_1 = require("../exceptions");
describe('EngineerLevel', () => {
    describe('static factory methods', () => {
        it('should create JUNIOR level', () => {
            const level = engineer_level_vo_1.EngineerLevel.JUNIOR;
            expect(level).toBeInstanceOf(engineer_level_vo_1.EngineerLevel);
            expect(level.value).toBe('JUNIOR');
        });
        it('should create MID level', () => {
            const level = engineer_level_vo_1.EngineerLevel.MID;
            expect(level).toBeInstanceOf(engineer_level_vo_1.EngineerLevel);
            expect(level.value).toBe('MID');
        });
        it('should create SENIOR level', () => {
            const level = engineer_level_vo_1.EngineerLevel.SENIOR;
            expect(level).toBeInstanceOf(engineer_level_vo_1.EngineerLevel);
            expect(level.value).toBe('SENIOR');
        });
        it('should create LEAD level', () => {
            const level = engineer_level_vo_1.EngineerLevel.LEAD;
            expect(level).toBeInstanceOf(engineer_level_vo_1.EngineerLevel);
            expect(level.value).toBe('LEAD');
        });
        it('should create MANAGER level', () => {
            const level = engineer_level_vo_1.EngineerLevel.MANAGER;
            expect(level).toBeInstanceOf(engineer_level_vo_1.EngineerLevel);
            expect(level.value).toBe('MANAGER');
        });
    });
    describe('fromString', () => {
        it('should create JUNIOR level from string', () => {
            const level = engineer_level_vo_1.EngineerLevel.fromString('JUNIOR');
            expect(level.value).toBe('JUNIOR');
        });
        it('should create MID level from string', () => {
            const level = engineer_level_vo_1.EngineerLevel.fromString('MID');
            expect(level.value).toBe('MID');
        });
        it('should create SENIOR level from string', () => {
            const level = engineer_level_vo_1.EngineerLevel.fromString('SENIOR');
            expect(level.value).toBe('SENIOR');
        });
        it('should create LEAD level from string', () => {
            const level = engineer_level_vo_1.EngineerLevel.fromString('LEAD');
            expect(level.value).toBe('LEAD');
        });
        it('should create MANAGER level from string', () => {
            const level = engineer_level_vo_1.EngineerLevel.fromString('MANAGER');
            expect(level.value).toBe('MANAGER');
        });
        it('should normalize to uppercase', () => {
            const level = engineer_level_vo_1.EngineerLevel.fromString('junior');
            expect(level.value).toBe('JUNIOR');
        });
        it('should trim whitespace', () => {
            const level = engineer_level_vo_1.EngineerLevel.fromString('  SENIOR  ');
            expect(level.value).toBe('SENIOR');
        });
        it('should throw InvalidEngineerLevelException for empty string', () => {
            expect(() => engineer_level_vo_1.EngineerLevel.fromString('')).toThrow(exceptions_1.InvalidEngineerLevelException);
            expect(() => engineer_level_vo_1.EngineerLevel.fromString('   ')).toThrow(exceptions_1.InvalidEngineerLevelException);
        });
        it('should throw InvalidEngineerLevelException for null/undefined', () => {
            expect(() => engineer_level_vo_1.EngineerLevel.fromString(null)).toThrow(exceptions_1.InvalidEngineerLevelException);
            expect(() => engineer_level_vo_1.EngineerLevel.fromString(undefined)).toThrow(exceptions_1.InvalidEngineerLevelException);
        });
        it('should throw InvalidEngineerLevelException for invalid level', () => {
            expect(() => engineer_level_vo_1.EngineerLevel.fromString('INVALID')).toThrow(exceptions_1.InvalidEngineerLevelException);
            expect(() => engineer_level_vo_1.EngineerLevel.fromString('PRINCIPAL')).toThrow(exceptions_1.InvalidEngineerLevelException);
        });
        it('should provide helpful error message with valid levels', () => {
            expect(() => engineer_level_vo_1.EngineerLevel.fromString('INVALID'))
                .toThrow(/JUNIOR, MID, SENIOR, LEAD, MANAGER/);
        });
    });
    describe('equals', () => {
        it('should return true for equal levels', () => {
            const level1 = engineer_level_vo_1.EngineerLevel.SENIOR;
            const level2 = engineer_level_vo_1.EngineerLevel.fromString('SENIOR');
            expect(level1.equals(level2)).toBe(true);
        });
        it('should return false for different levels', () => {
            const level1 = engineer_level_vo_1.EngineerLevel.JUNIOR;
            const level2 = engineer_level_vo_1.EngineerLevel.SENIOR;
            expect(level1.equals(level2)).toBe(false);
        });
        it('should return false for null/undefined', () => {
            const level = engineer_level_vo_1.EngineerLevel.SENIOR;
            expect(level.equals(null)).toBe(false);
            expect(level.equals(undefined)).toBe(false);
        });
    });
    describe('toString', () => {
        it('should return the level string value', () => {
            const level = engineer_level_vo_1.EngineerLevel.SENIOR;
            expect(level.toString()).toBe('SENIOR');
        });
    });
    describe('value getter', () => {
        it('should return the level value', () => {
            const level = engineer_level_vo_1.EngineerLevel.LEAD;
            expect(level.value).toBe('LEAD');
        });
    });
    describe('helper methods', () => {
        it('should check if level is JUNIOR', () => {
            expect(engineer_level_vo_1.EngineerLevel.JUNIOR.isJunior()).toBe(true);
            expect(engineer_level_vo_1.EngineerLevel.MID.isJunior()).toBe(false);
        });
        it('should check if level is MID', () => {
            expect(engineer_level_vo_1.EngineerLevel.MID.isMid()).toBe(true);
            expect(engineer_level_vo_1.EngineerLevel.SENIOR.isMid()).toBe(false);
        });
        it('should check if level is SENIOR', () => {
            expect(engineer_level_vo_1.EngineerLevel.SENIOR.isSenior()).toBe(true);
            expect(engineer_level_vo_1.EngineerLevel.LEAD.isSenior()).toBe(false);
        });
        it('should check if level is LEAD', () => {
            expect(engineer_level_vo_1.EngineerLevel.LEAD.isLead()).toBe(true);
            expect(engineer_level_vo_1.EngineerLevel.MANAGER.isLead()).toBe(false);
        });
        it('should check if level is MANAGER', () => {
            expect(engineer_level_vo_1.EngineerLevel.MANAGER.isManager()).toBe(true);
            expect(engineer_level_vo_1.EngineerLevel.SENIOR.isManager()).toBe(false);
        });
    });
});
//# sourceMappingURL=engineer-level.vo.spec.js.map