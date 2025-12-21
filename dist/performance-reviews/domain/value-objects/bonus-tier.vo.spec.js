"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bonus_tier_vo_1 = require("./bonus-tier.vo");
describe('BonusTier', () => {
    describe('static factory methods', () => {
        it('should create EXCEEDS tier', () => {
            const tier = bonus_tier_vo_1.BonusTier.EXCEEDS;
            expect(tier).toBeInstanceOf(bonus_tier_vo_1.BonusTier);
            expect(tier.value).toBe('EXCEEDS');
        });
        it('should create MEETS tier', () => {
            const tier = bonus_tier_vo_1.BonusTier.MEETS;
            expect(tier).toBeInstanceOf(bonus_tier_vo_1.BonusTier);
            expect(tier.value).toBe('MEETS');
        });
        it('should create BELOW tier', () => {
            const tier = bonus_tier_vo_1.BonusTier.BELOW;
            expect(tier).toBeInstanceOf(bonus_tier_vo_1.BonusTier);
            expect(tier.value).toBe('BELOW');
        });
    });
    describe('fromPercentage', () => {
        it('should return EXCEEDS for percentage >= 85', () => {
            expect(bonus_tier_vo_1.BonusTier.fromPercentage(85).value).toBe('EXCEEDS');
            expect(bonus_tier_vo_1.BonusTier.fromPercentage(90).value).toBe('EXCEEDS');
            expect(bonus_tier_vo_1.BonusTier.fromPercentage(100).value).toBe('EXCEEDS');
            expect(bonus_tier_vo_1.BonusTier.fromPercentage(110).value).toBe('EXCEEDS');
        });
        it('should return MEETS for percentage between 50 and 84', () => {
            expect(bonus_tier_vo_1.BonusTier.fromPercentage(50).value).toBe('MEETS');
            expect(bonus_tier_vo_1.BonusTier.fromPercentage(70).value).toBe('MEETS');
            expect(bonus_tier_vo_1.BonusTier.fromPercentage(84).value).toBe('MEETS');
            expect(bonus_tier_vo_1.BonusTier.fromPercentage(84.9).value).toBe('MEETS');
        });
        it('should return BELOW for percentage < 50', () => {
            expect(bonus_tier_vo_1.BonusTier.fromPercentage(0).value).toBe('BELOW');
            expect(bonus_tier_vo_1.BonusTier.fromPercentage(25).value).toBe('BELOW');
            expect(bonus_tier_vo_1.BonusTier.fromPercentage(49).value).toBe('BELOW');
            expect(bonus_tier_vo_1.BonusTier.fromPercentage(49.9).value).toBe('BELOW');
        });
        it('should handle negative percentages', () => {
            expect(bonus_tier_vo_1.BonusTier.fromPercentage(-10).value).toBe('BELOW');
        });
    });
    describe('equals', () => {
        it('should return true for equal tiers', () => {
            const tier1 = bonus_tier_vo_1.BonusTier.EXCEEDS;
            const tier2 = bonus_tier_vo_1.BonusTier.fromPercentage(90);
            expect(tier1.equals(tier2)).toBe(true);
        });
        it('should return false for different tiers', () => {
            const tier1 = bonus_tier_vo_1.BonusTier.EXCEEDS;
            const tier2 = bonus_tier_vo_1.BonusTier.MEETS;
            expect(tier1.equals(tier2)).toBe(false);
        });
        it('should return false for null/undefined', () => {
            const tier = bonus_tier_vo_1.BonusTier.EXCEEDS;
            expect(tier.equals(null)).toBe(false);
            expect(tier.equals(undefined)).toBe(false);
        });
    });
    describe('helper methods', () => {
        it('should check if tier is EXCEEDS', () => {
            expect(bonus_tier_vo_1.BonusTier.EXCEEDS.isExceeds()).toBe(true);
            expect(bonus_tier_vo_1.BonusTier.MEETS.isExceeds()).toBe(false);
            expect(bonus_tier_vo_1.BonusTier.BELOW.isExceeds()).toBe(false);
        });
        it('should check if tier is MEETS', () => {
            expect(bonus_tier_vo_1.BonusTier.MEETS.isMeets()).toBe(true);
            expect(bonus_tier_vo_1.BonusTier.EXCEEDS.isMeets()).toBe(false);
            expect(bonus_tier_vo_1.BonusTier.BELOW.isMeets()).toBe(false);
        });
        it('should check if tier is BELOW', () => {
            expect(bonus_tier_vo_1.BonusTier.BELOW.isBelow()).toBe(true);
            expect(bonus_tier_vo_1.BonusTier.EXCEEDS.isBelow()).toBe(false);
            expect(bonus_tier_vo_1.BonusTier.MEETS.isBelow()).toBe(false);
        });
    });
    describe('toString', () => {
        it('should return the tier string value', () => {
            expect(bonus_tier_vo_1.BonusTier.EXCEEDS.toString()).toBe('EXCEEDS');
            expect(bonus_tier_vo_1.BonusTier.MEETS.toString()).toBe('MEETS');
            expect(bonus_tier_vo_1.BonusTier.BELOW.toString()).toBe('BELOW');
        });
    });
    describe('value getter', () => {
        it('should return the tier value', () => {
            expect(bonus_tier_vo_1.BonusTier.EXCEEDS.value).toBe('EXCEEDS');
            expect(bonus_tier_vo_1.BonusTier.MEETS.value).toBe('MEETS');
            expect(bonus_tier_vo_1.BonusTier.BELOW.value).toBe('BELOW');
        });
    });
});
//# sourceMappingURL=bonus-tier.vo.spec.js.map