"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const review_cycle_id_vo_1 = require("./review-cycle-id.vo");
const exceptions_1 = require("../exceptions");
describe('ReviewCycleId', () => {
    describe('generate', () => {
        it('should generate a new ReviewCycleId with UUID v4', () => {
            const id = review_cycle_id_vo_1.ReviewCycleId.generate();
            expect(id).toBeInstanceOf(review_cycle_id_vo_1.ReviewCycleId);
            expect(id.value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
        });
        it('should generate unique IDs', () => {
            const id1 = review_cycle_id_vo_1.ReviewCycleId.generate();
            const id2 = review_cycle_id_vo_1.ReviewCycleId.generate();
            expect(id1.value).not.toBe(id2.value);
        });
    });
    describe('fromString', () => {
        const validUuid = '550e8400-e29b-41d4-a716-446655440000';
        it('should create ReviewCycleId from valid UUID string', () => {
            const id = review_cycle_id_vo_1.ReviewCycleId.fromString(validUuid);
            expect(id).toBeInstanceOf(review_cycle_id_vo_1.ReviewCycleId);
            expect(id.value).toBe(validUuid.toLowerCase());
        });
        it('should normalize UUID to lowercase', () => {
            const upperUuid = '550E8400-E29B-41D4-A716-446655440000';
            const id = review_cycle_id_vo_1.ReviewCycleId.fromString(upperUuid);
            expect(id.value).toBe(upperUuid.toLowerCase());
        });
        it('should trim whitespace', () => {
            const id = review_cycle_id_vo_1.ReviewCycleId.fromString(`  ${validUuid}  `);
            expect(id.value).toBe(validUuid);
        });
        it('should throw InvalidReviewCycleIdException for empty string', () => {
            expect(() => review_cycle_id_vo_1.ReviewCycleId.fromString('')).toThrow(exceptions_1.InvalidReviewCycleIdException);
            expect(() => review_cycle_id_vo_1.ReviewCycleId.fromString('   ')).toThrow(exceptions_1.InvalidReviewCycleIdException);
        });
        it('should throw InvalidReviewCycleIdException for null/undefined', () => {
            expect(() => review_cycle_id_vo_1.ReviewCycleId.fromString(null)).toThrow(exceptions_1.InvalidReviewCycleIdException);
            expect(() => review_cycle_id_vo_1.ReviewCycleId.fromString(undefined)).toThrow(exceptions_1.InvalidReviewCycleIdException);
        });
        it('should throw InvalidReviewCycleIdException for invalid UUID format', () => {
            expect(() => review_cycle_id_vo_1.ReviewCycleId.fromString('not-a-uuid')).toThrow(exceptions_1.InvalidReviewCycleIdException);
            expect(() => review_cycle_id_vo_1.ReviewCycleId.fromString('12345')).toThrow(exceptions_1.InvalidReviewCycleIdException);
            expect(() => review_cycle_id_vo_1.ReviewCycleId.fromString('550e8400-e29b-31d4-a716-446655440000')).toThrow(exceptions_1.InvalidReviewCycleIdException);
        });
    });
    describe('equals', () => {
        it('should return true for equal ReviewCycleIds', () => {
            const uuid = '550e8400-e29b-41d4-a716-446655440000';
            const id1 = review_cycle_id_vo_1.ReviewCycleId.fromString(uuid);
            const id2 = review_cycle_id_vo_1.ReviewCycleId.fromString(uuid);
            expect(id1.equals(id2)).toBe(true);
        });
        it('should return false for different ReviewCycleIds', () => {
            const id1 = review_cycle_id_vo_1.ReviewCycleId.generate();
            const id2 = review_cycle_id_vo_1.ReviewCycleId.generate();
            expect(id1.equals(id2)).toBe(false);
        });
        it('should return false for null/undefined', () => {
            const id = review_cycle_id_vo_1.ReviewCycleId.generate();
            expect(id.equals(null)).toBe(false);
            expect(id.equals(undefined)).toBe(false);
        });
    });
    describe('toString', () => {
        it('should return the UUID string value', () => {
            const uuid = '550e8400-e29b-41d4-a716-446655440000';
            const id = review_cycle_id_vo_1.ReviewCycleId.fromString(uuid);
            expect(id.toString()).toBe(uuid);
        });
    });
    describe('value getter', () => {
        it('should return the UUID value', () => {
            const uuid = '550e8400-e29b-41d4-a716-446655440000';
            const id = review_cycle_id_vo_1.ReviewCycleId.fromString(uuid);
            expect(id.value).toBe(uuid);
        });
    });
});
//# sourceMappingURL=review-cycle-id.vo.spec.js.map