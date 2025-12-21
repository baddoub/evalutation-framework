"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
describe('Email Value Object', () => {
    describe('create', () => {
        it('should accept valid email formats', () => {
            const validEmails = [
                'test@example.com',
                'user.name@example.com',
                'user+tag@example.co.uk',
                'user_name@example-domain.com',
                'test123@test.org',
            ];
            validEmails.forEach((emailStr) => {
                const email = email_vo_1.Email.create(emailStr);
                expect(email).toBeDefined();
                expect(email.value).toBe(emailStr.toLowerCase());
            });
        });
        it('should reject invalid email formats', () => {
            const invalidEmails = [
                '',
                ' ',
                'notanemail',
                '@example.com',
                'user@',
                'user @example.com',
                'user@.com',
            ];
            invalidEmails.forEach((emailStr) => {
                expect(() => email_vo_1.Email.create(emailStr)).toThrow(invalid_email_exception_1.InvalidEmailException);
            });
        });
        it('should normalize email to lowercase', () => {
            const email = email_vo_1.Email.create('TEST@EXAMPLE.COM');
            expect(email.value).toBe('test@example.com');
            const email2 = email_vo_1.Email.create('User.Name@Example.Com');
            expect(email2.value).toBe('user.name@example.com');
        });
        it('should trim whitespace from email', () => {
            const email = email_vo_1.Email.create('  test@example.com  ');
            expect(email.value).toBe('test@example.com');
            const email2 = email_vo_1.Email.create('\tuser@example.com\n');
            expect(email2.value).toBe('user@example.com');
        });
    });
    describe('equals', () => {
        it('should return true for emails with same value', () => {
            const email1 = email_vo_1.Email.create('test@example.com');
            const email2 = email_vo_1.Email.create('test@example.com');
            expect(email1.equals(email2)).toBe(true);
        });
        it('should return true for emails with different casing but same normalized value', () => {
            const email1 = email_vo_1.Email.create('TEST@EXAMPLE.COM');
            const email2 = email_vo_1.Email.create('test@example.com');
            expect(email1.equals(email2)).toBe(true);
        });
        it('should return false for emails with different values', () => {
            const email1 = email_vo_1.Email.create('test1@example.com');
            const email2 = email_vo_1.Email.create('test2@example.com');
            expect(email1.equals(email2)).toBe(false);
        });
    });
    describe('toString', () => {
        it('should return the email value as string', () => {
            const email = email_vo_1.Email.create('test@example.com');
            expect(email.toString()).toBe('test@example.com');
        });
    });
    describe('immutability', () => {
        it('should not allow modification of email value after creation', () => {
            const email = email_vo_1.Email.create('test@example.com');
            const originalValue = email.value;
            expect(email.value).toBe(originalValue);
            expect(email.value).toBe('test@example.com');
        });
    });
});
const email_vo_1 = require("./email.vo");
const invalid_email_exception_1 = require("../exceptions/invalid-email.exception");
//# sourceMappingURL=email.vo.spec.js.map