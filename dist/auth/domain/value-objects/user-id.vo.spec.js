"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
describe('UserId Value Object', () => {
    describe('generate', () => {
        it('should generate valid UUID v4', () => {
            const userId = user_id_vo_1.UserId.generate();
            expect(userId).toBeDefined();
            expect(userId.value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
        });
        it('should generate unique IDs', () => {
            const userId1 = user_id_vo_1.UserId.generate();
            const userId2 = user_id_vo_1.UserId.generate();
            expect(userId1.equals(userId2)).toBe(false);
        });
    });
    describe('fromString', () => {
        it('should accept valid UUID string', () => {
            const validUuid = '550e8400-e29b-41d4-a716-446655440000';
            const userId = user_id_vo_1.UserId.fromString(validUuid);
            expect(userId).toBeDefined();
            expect(userId.value).toBe(validUuid);
        });
        it('should reject invalid UUID format', () => {
            const invalidUuids = [
                '',
                'not-a-uuid',
                '12345',
                '550e8400-e29b-41d4-a716',
                '550e8400-e29b-51d4-a716-446655440000',
                'g50e8400-e29b-41d4-a716-446655440000',
            ];
            invalidUuids.forEach((invalid) => {
                expect(() => user_id_vo_1.UserId.fromString(invalid)).toThrow(invalid_user_id_exception_1.InvalidUserIdException);
            });
        });
        it('should be case-insensitive', () => {
            const uuidLower = '550e8400-e29b-41d4-a716-446655440000';
            const uuidUpper = '550E8400-E29B-41D4-A716-446655440000';
            const userId1 = user_id_vo_1.UserId.fromString(uuidLower);
            const userId2 = user_id_vo_1.UserId.fromString(uuidUpper);
            expect(userId1.value).toBe(uuidLower);
            expect(userId2.value).toBe(uuidLower);
        });
    });
    describe('equals', () => {
        it('should return true for UserIds with same value', () => {
            const uuid = '550e8400-e29b-41d4-a716-446655440000';
            const userId1 = user_id_vo_1.UserId.fromString(uuid);
            const userId2 = user_id_vo_1.UserId.fromString(uuid);
            expect(userId1.equals(userId2)).toBe(true);
        });
        it('should return false for UserIds with different values', () => {
            const userId1 = user_id_vo_1.UserId.fromString('550e8400-e29b-41d4-a716-446655440000');
            const userId2 = user_id_vo_1.UserId.fromString('660e8400-e29b-41d4-a716-446655440001');
            expect(userId1.equals(userId2)).toBe(false);
        });
        it('should return false when comparing with null', () => {
            const userId = user_id_vo_1.UserId.generate();
            expect(userId.equals(null)).toBe(false);
        });
    });
    describe('immutability', () => {
        it('should not allow modification of value after creation', () => {
            const userId = user_id_vo_1.UserId.generate();
            const originalValue = userId.value;
            expect(userId.value).toBe(originalValue);
        });
    });
    describe('toString', () => {
        it('should return UUID as string', () => {
            const uuid = '550e8400-e29b-41d4-a716-446655440000';
            const userId = user_id_vo_1.UserId.fromString(uuid);
            expect(userId.toString()).toBe(uuid);
        });
    });
});
const user_id_vo_1 = require("./user-id.vo");
const invalid_user_id_exception_1 = require("../exceptions/invalid-user-id.exception");
//# sourceMappingURL=user-id.vo.spec.js.map