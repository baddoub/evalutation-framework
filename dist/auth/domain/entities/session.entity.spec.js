"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const session_entity_1 = require("./session.entity");
const user_id_vo_1 = require("../value-objects/user-id.vo");
describe('Session Entity', () => {
    const createValidSessionData = () => ({
        id: crypto.randomUUID(),
        userId: user_id_vo_1.UserId.generate(),
        deviceId: 'device-123',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        ipAddress: '192.168.1.1',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        lastUsed: new Date(),
    });
    describe('create', () => {
        it('should create a session with valid data', () => {
            const data = createValidSessionData();
            const session = session_entity_1.Session.create(data);
            expect(session).toBeDefined();
            expect(session.id).toBe(data.id);
            expect(session.userId.equals(data.userId)).toBe(true);
            expect(session.deviceId).toBe(data.deviceId);
            expect(session.userAgent).toBe(data.userAgent);
            expect(session.ipAddress).toBe(data.ipAddress);
            expect(session.expiresAt).toEqual(data.expiresAt);
            expect(session.lastUsed).toEqual(data.lastUsed);
        });
        it('should reject empty id', () => {
            const data = { ...createValidSessionData(), id: '' };
            expect(() => session_entity_1.Session.create(data)).toThrow('Session ID is required');
        });
        it('should reject expiration in the past', () => {
            const data = {
                ...createValidSessionData(),
                expiresAt: new Date(Date.now() - 1000),
            };
            expect(() => session_entity_1.Session.create(data)).toThrow('Session expiration in past');
        });
        it('should allow creation with null deviceId', () => {
            const data = { ...createValidSessionData(), deviceId: null };
            const session = session_entity_1.Session.create(data);
            expect(session.deviceId).toBeNull();
        });
        it('should allow creation with null userAgent', () => {
            const data = { ...createValidSessionData(), userAgent: null };
            const session = session_entity_1.Session.create(data);
            expect(session.userAgent).toBeNull();
        });
        it('should allow creation with null ipAddress', () => {
            const data = { ...createValidSessionData(), ipAddress: null };
            const session = session_entity_1.Session.create(data);
            expect(session.ipAddress).toBeNull();
        });
        it('should reject userAgent longer than 500 characters', () => {
            const data = { ...createValidSessionData(), userAgent: 'a'.repeat(501) };
            expect(() => session_entity_1.Session.create(data)).toThrow('User agent string too long');
        });
        it('should accept userAgent exactly 500 characters', () => {
            const data = { ...createValidSessionData(), userAgent: 'a'.repeat(500) };
            const session = session_entity_1.Session.create(data);
            expect(session.userAgent).toHaveLength(500);
        });
        it('should reject invalid IP address format', () => {
            const data = { ...createValidSessionData(), ipAddress: '999.999.999.999' };
            expect(() => session_entity_1.Session.create(data)).toThrow('Invalid IP address format');
        });
        it('should accept valid IPv4 address', () => {
            const data = { ...createValidSessionData(), ipAddress: '192.168.1.1' };
            const session = session_entity_1.Session.create(data);
            expect(session.ipAddress).toBe('192.168.1.1');
        });
        it('should accept valid IPv6 address', () => {
            const data = {
                ...createValidSessionData(),
                ipAddress: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
            };
            const session = session_entity_1.Session.create(data);
            expect(session.ipAddress).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
        });
    });
    describe('isExpired', () => {
        it('should return false for non-expired session', () => {
            const session = session_entity_1.Session.create(createValidSessionData());
            expect(session.isExpired()).toBe(false);
        });
        it('should return true for expired session', () => {
            const data = {
                ...createValidSessionData(),
                expiresAt: new Date(Date.now() + 100),
            };
            const session = session_entity_1.Session.create(data);
            setTimeout(() => {
                expect(session.isExpired()).toBe(true);
            }, 150);
        });
        it('should return true when expiresAt is exactly now', () => {
            const now = new Date();
            const data = {
                ...createValidSessionData(),
                expiresAt: now,
            };
            const session = session_entity_1.Session.create({
                ...data,
                createdAt: new Date(now.getTime() - 1000),
            });
            const originalNow = Date.now;
            Date.now = jest.fn(() => now.getTime());
            expect(session.isExpired()).toBe(true);
            Date.now = originalNow;
        });
    });
    describe('updateLastUsed', () => {
        it('should update lastUsed timestamp', () => {
            const session = session_entity_1.Session.create(createValidSessionData());
            const originalLastUsed = session.lastUsed;
            setTimeout(() => {
                session.updateLastUsed();
                expect(session.lastUsed.getTime()).toBeGreaterThan(originalLastUsed.getTime());
            }, 10);
        });
        it('should update lastUsed multiple times', () => {
            const session = session_entity_1.Session.create(createValidSessionData());
            const originalLastUsed = session.lastUsed;
            setTimeout(() => {
                session.updateLastUsed();
                const firstUpdate = session.lastUsed;
                setTimeout(() => {
                    session.updateLastUsed();
                    const secondUpdate = session.lastUsed;
                    expect(firstUpdate.getTime()).toBeGreaterThan(originalLastUsed.getTime());
                    expect(secondUpdate.getTime()).toBeGreaterThan(firstUpdate.getTime());
                }, 10);
            }, 10);
        });
    });
    describe('isFromSameDevice', () => {
        it('should return true for matching deviceId', () => {
            const data = createValidSessionData();
            const session = session_entity_1.Session.create(data);
            expect(session.isFromSameDevice(data.deviceId)).toBe(true);
        });
        it('should return false for different deviceId', () => {
            const session = session_entity_1.Session.create(createValidSessionData());
            expect(session.isFromSameDevice('different-device-id')).toBe(false);
        });
        it('should return false when session has null deviceId', () => {
            const data = { ...createValidSessionData(), deviceId: null };
            const session = session_entity_1.Session.create(data);
            expect(session.isFromSameDevice('some-device-id')).toBe(false);
        });
        it('should return true when both are null', () => {
            const data = { ...createValidSessionData(), deviceId: null };
            const session = session_entity_1.Session.create(data);
            expect(session.isFromSameDevice(null)).toBe(true);
        });
    });
    describe('immutability', () => {
        it('should not allow id modification', () => {
            const session = session_entity_1.Session.create(createValidSessionData());
            const originalId = session.id;
            expect(session.id).toBe(originalId);
        });
        it('should not allow userId modification', () => {
            const session = session_entity_1.Session.create(createValidSessionData());
            const originalUserId = session.userId;
            expect(session.userId).toBe(originalUserId);
        });
        it('should not allow deviceId modification', () => {
            const session = session_entity_1.Session.create(createValidSessionData());
            const originalDeviceId = session.deviceId;
            expect(session.deviceId).toBe(originalDeviceId);
        });
        it('should not allow userAgent modification', () => {
            const session = session_entity_1.Session.create(createValidSessionData());
            const originalUserAgent = session.userAgent;
            expect(session.userAgent).toBe(originalUserAgent);
        });
        it('should not allow ipAddress modification', () => {
            const session = session_entity_1.Session.create(createValidSessionData());
            const originalIpAddress = session.ipAddress;
            expect(session.ipAddress).toBe(originalIpAddress);
        });
        it('should not allow expiresAt modification', () => {
            const session = session_entity_1.Session.create(createValidSessionData());
            const originalExpiresAt = session.expiresAt;
            expect(session.expiresAt).toBe(originalExpiresAt);
        });
        it('should not allow createdAt modification', () => {
            const session = session_entity_1.Session.create(createValidSessionData());
            const originalCreatedAt = session.createdAt;
            expect(session.createdAt).toBe(originalCreatedAt);
        });
    });
    describe('typical session workflow', () => {
        it('should support typical session lifecycle', () => {
            const session = session_entity_1.Session.create(createValidSessionData());
            expect(session.isExpired()).toBe(false);
            session.updateLastUsed();
            expect(session.lastUsed).toBeDefined();
            expect(session.isFromSameDevice('device-123')).toBe(true);
            expect(session.isFromSameDevice('other-device')).toBe(false);
            expect(session.isExpired()).toBe(false);
        });
    });
});
//# sourceMappingURL=session.entity.spec.js.map