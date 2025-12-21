"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const review_cycle_entity_1 = require("./review-cycle.entity");
const review_cycle_id_vo_1 = require("../value-objects/review-cycle-id.vo");
const cycle_deadlines_vo_1 = require("../value-objects/cycle-deadlines.vo");
const invalid_review_cycle_state_exception_1 = require("../exceptions/invalid-review-cycle-state.exception");
describe('ReviewCycle', () => {
    const createValidDeadlines = () => {
        const now = new Date();
        return cycle_deadlines_vo_1.CycleDeadlines.create({
            selfReview: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
            peerFeedback: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
            managerEvaluation: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
            calibration: new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000),
            feedbackDelivery: new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000),
        });
    };
    const createValidProps = () => ({
        name: 'Q1 2024 Performance Review',
        year: 2024,
        deadlines: createValidDeadlines(),
    });
    describe('CycleStatus', () => {
        describe('static constants', () => {
            it('should provide DRAFT status constant', () => {
                expect(review_cycle_entity_1.CycleStatus.DRAFT).toBeInstanceOf(review_cycle_entity_1.CycleStatus);
                expect(review_cycle_entity_1.CycleStatus.DRAFT.value).toBe('DRAFT');
            });
            it('should provide ACTIVE status constant', () => {
                expect(review_cycle_entity_1.CycleStatus.ACTIVE).toBeInstanceOf(review_cycle_entity_1.CycleStatus);
                expect(review_cycle_entity_1.CycleStatus.ACTIVE.value).toBe('ACTIVE');
            });
            it('should provide CALIBRATION status constant', () => {
                expect(review_cycle_entity_1.CycleStatus.CALIBRATION).toBeInstanceOf(review_cycle_entity_1.CycleStatus);
                expect(review_cycle_entity_1.CycleStatus.CALIBRATION.value).toBe('CALIBRATION');
            });
            it('should provide COMPLETED status constant', () => {
                expect(review_cycle_entity_1.CycleStatus.COMPLETED).toBeInstanceOf(review_cycle_entity_1.CycleStatus);
                expect(review_cycle_entity_1.CycleStatus.COMPLETED.value).toBe('COMPLETED');
            });
        });
        describe('fromString', () => {
            it('should create DRAFT status from string', () => {
                const status = review_cycle_entity_1.CycleStatus.fromString('DRAFT');
                expect(status).toBe(review_cycle_entity_1.CycleStatus.DRAFT);
            });
            it('should create ACTIVE status from string', () => {
                const status = review_cycle_entity_1.CycleStatus.fromString('ACTIVE');
                expect(status).toBe(review_cycle_entity_1.CycleStatus.ACTIVE);
            });
            it('should create CALIBRATION status from string', () => {
                const status = review_cycle_entity_1.CycleStatus.fromString('CALIBRATION');
                expect(status).toBe(review_cycle_entity_1.CycleStatus.CALIBRATION);
            });
            it('should create COMPLETED status from string', () => {
                const status = review_cycle_entity_1.CycleStatus.fromString('COMPLETED');
                expect(status).toBe(review_cycle_entity_1.CycleStatus.COMPLETED);
            });
            it('should handle lowercase input', () => {
                expect(review_cycle_entity_1.CycleStatus.fromString('draft')).toBe(review_cycle_entity_1.CycleStatus.DRAFT);
                expect(review_cycle_entity_1.CycleStatus.fromString('active')).toBe(review_cycle_entity_1.CycleStatus.ACTIVE);
                expect(review_cycle_entity_1.CycleStatus.fromString('calibration')).toBe(review_cycle_entity_1.CycleStatus.CALIBRATION);
                expect(review_cycle_entity_1.CycleStatus.fromString('completed')).toBe(review_cycle_entity_1.CycleStatus.COMPLETED);
            });
            it('should handle mixed case input', () => {
                expect(review_cycle_entity_1.CycleStatus.fromString('DrAfT')).toBe(review_cycle_entity_1.CycleStatus.DRAFT);
                expect(review_cycle_entity_1.CycleStatus.fromString('AcTiVe')).toBe(review_cycle_entity_1.CycleStatus.ACTIVE);
            });
            it('should throw error for invalid status', () => {
                expect(() => review_cycle_entity_1.CycleStatus.fromString('INVALID')).toThrow('Invalid cycle status: INVALID');
                expect(() => review_cycle_entity_1.CycleStatus.fromString('')).toThrow();
                expect(() => review_cycle_entity_1.CycleStatus.fromString('PENDING')).toThrow();
            });
        });
        describe('equals', () => {
            it('should return true for same status', () => {
                expect(review_cycle_entity_1.CycleStatus.DRAFT.equals(review_cycle_entity_1.CycleStatus.DRAFT)).toBe(true);
                expect(review_cycle_entity_1.CycleStatus.ACTIVE.equals(review_cycle_entity_1.CycleStatus.ACTIVE)).toBe(true);
                expect(review_cycle_entity_1.CycleStatus.CALIBRATION.equals(review_cycle_entity_1.CycleStatus.CALIBRATION)).toBe(true);
                expect(review_cycle_entity_1.CycleStatus.COMPLETED.equals(review_cycle_entity_1.CycleStatus.COMPLETED)).toBe(true);
            });
            it('should return false for different statuses', () => {
                expect(review_cycle_entity_1.CycleStatus.DRAFT.equals(review_cycle_entity_1.CycleStatus.ACTIVE)).toBe(false);
                expect(review_cycle_entity_1.CycleStatus.ACTIVE.equals(review_cycle_entity_1.CycleStatus.CALIBRATION)).toBe(false);
                expect(review_cycle_entity_1.CycleStatus.CALIBRATION.equals(review_cycle_entity_1.CycleStatus.COMPLETED)).toBe(false);
                expect(review_cycle_entity_1.CycleStatus.COMPLETED.equals(review_cycle_entity_1.CycleStatus.DRAFT)).toBe(false);
            });
            it('should return false for null or undefined', () => {
                expect(review_cycle_entity_1.CycleStatus.DRAFT.equals(null)).toBe(false);
                expect(review_cycle_entity_1.CycleStatus.DRAFT.equals(undefined)).toBe(false);
            });
        });
        describe('value getter', () => {
            it('should return the string value', () => {
                expect(review_cycle_entity_1.CycleStatus.DRAFT.value).toBe('DRAFT');
                expect(review_cycle_entity_1.CycleStatus.ACTIVE.value).toBe('ACTIVE');
                expect(review_cycle_entity_1.CycleStatus.CALIBRATION.value).toBe('CALIBRATION');
                expect(review_cycle_entity_1.CycleStatus.COMPLETED.value).toBe('COMPLETED');
            });
        });
    });
    describe('ReviewCycle', () => {
        describe('create', () => {
            it('should create a ReviewCycle with generated id in DRAFT status', () => {
                const props = createValidProps();
                const cycle = review_cycle_entity_1.ReviewCycle.create(props);
                expect(cycle).toBeInstanceOf(review_cycle_entity_1.ReviewCycle);
                expect(cycle.id).toBeInstanceOf(review_cycle_id_vo_1.ReviewCycleId);
                expect(cycle.name).toBe(props.name);
                expect(cycle.year).toBe(props.year);
                expect(cycle.status).toBe(review_cycle_entity_1.CycleStatus.DRAFT);
                expect(cycle.deadlines).toBe(props.deadlines);
                expect(cycle.startDate).toBeInstanceOf(Date);
                expect(cycle.endDate).toBeUndefined();
                expect(cycle.isActive).toBe(false);
                expect(cycle.isCompleted).toBe(false);
            });
            it('should create a ReviewCycle with provided id', () => {
                const props = createValidProps();
                const customId = review_cycle_id_vo_1.ReviewCycleId.generate();
                const cycle = review_cycle_entity_1.ReviewCycle.create({ ...props, id: customId });
                expect(cycle.id).toBe(customId);
            });
            it('should create a ReviewCycle with provided startDate', () => {
                const props = createValidProps();
                const customStartDate = new Date('2024-01-01');
                const cycle = review_cycle_entity_1.ReviewCycle.create({ ...props, startDate: customStartDate });
                expect(cycle.startDate).toBe(customStartDate);
            });
            it('should create a ReviewCycle with default startDate when not provided', () => {
                const props = createValidProps();
                const beforeCreate = new Date();
                const cycle = review_cycle_entity_1.ReviewCycle.create(props);
                const afterCreate = new Date();
                expect(cycle.startDate.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
                expect(cycle.startDate.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
            });
            it('should create multiple ReviewCycles with unique ids', () => {
                const props = createValidProps();
                const cycle1 = review_cycle_entity_1.ReviewCycle.create(props);
                const cycle2 = review_cycle_entity_1.ReviewCycle.create(props);
                expect(cycle1.id).not.toBe(cycle2.id);
            });
        });
        describe('start', () => {
            it('should start a cycle from DRAFT status', () => {
                const props = createValidProps();
                const cycle = review_cycle_entity_1.ReviewCycle.create(props);
                expect(cycle.status).toBe(review_cycle_entity_1.CycleStatus.DRAFT);
                cycle.start();
                expect(cycle.status).toBe(review_cycle_entity_1.CycleStatus.ACTIVE);
                expect(cycle.isActive).toBe(true);
            });
            it('should throw error when starting from ACTIVE status', () => {
                const props = createValidProps();
                const cycle = review_cycle_entity_1.ReviewCycle.create(props);
                cycle.start();
                expect(() => cycle.start()).toThrow(invalid_review_cycle_state_exception_1.InvalidReviewCycleStateException);
                expect(() => cycle.start()).toThrow('Cannot start cycle from ACTIVE status. Must be DRAFT');
            });
            it('should throw error when starting from CALIBRATION status', () => {
                const props = createValidProps();
                const cycle = review_cycle_entity_1.ReviewCycle.create(props);
                cycle.start();
                cycle.enterCalibration();
                expect(() => cycle.start()).toThrow(invalid_review_cycle_state_exception_1.InvalidReviewCycleStateException);
                expect(() => cycle.start()).toThrow('Cannot start cycle from CALIBRATION status. Must be DRAFT');
            });
            it('should throw error when starting from COMPLETED status', () => {
                const props = createValidProps();
                const cycle = review_cycle_entity_1.ReviewCycle.create(props);
                cycle.start();
                cycle.enterCalibration();
                cycle.complete();
                expect(() => cycle.start()).toThrow(invalid_review_cycle_state_exception_1.InvalidReviewCycleStateException);
                expect(() => cycle.start()).toThrow('Cannot start cycle from COMPLETED status. Must be DRAFT');
            });
        });
        describe('activate', () => {
            it('should activate a cycle from DRAFT status', () => {
                const props = createValidProps();
                const cycle = review_cycle_entity_1.ReviewCycle.create(props);
                expect(cycle.status).toBe(review_cycle_entity_1.CycleStatus.DRAFT);
                cycle.activate();
                expect(cycle.status).toBe(review_cycle_entity_1.CycleStatus.ACTIVE);
                expect(cycle.isActive).toBe(true);
            });
            it('should be an alias for start method', () => {
                const props = createValidProps();
                const cycle1 = review_cycle_entity_1.ReviewCycle.create(props);
                const cycle2 = review_cycle_entity_1.ReviewCycle.create(props);
                cycle1.start();
                cycle2.activate();
                expect(cycle1.status).toBe(review_cycle_entity_1.CycleStatus.ACTIVE);
                expect(cycle2.status).toBe(review_cycle_entity_1.CycleStatus.ACTIVE);
            });
        });
        describe('enterCalibration', () => {
            it('should enter calibration from ACTIVE status', () => {
                const props = createValidProps();
                const cycle = review_cycle_entity_1.ReviewCycle.create(props);
                cycle.start();
                expect(cycle.status).toBe(review_cycle_entity_1.CycleStatus.ACTIVE);
                cycle.enterCalibration();
                expect(cycle.status).toBe(review_cycle_entity_1.CycleStatus.CALIBRATION);
            });
            it('should throw error when entering calibration from DRAFT status', () => {
                const props = createValidProps();
                const cycle = review_cycle_entity_1.ReviewCycle.create(props);
                expect(() => cycle.enterCalibration()).toThrow(invalid_review_cycle_state_exception_1.InvalidReviewCycleStateException);
                expect(() => cycle.enterCalibration()).toThrow('Cannot enter calibration from DRAFT status. Must be ACTIVE');
            });
            it('should throw error when entering calibration from CALIBRATION status', () => {
                const props = createValidProps();
                const cycle = review_cycle_entity_1.ReviewCycle.create(props);
                cycle.start();
                cycle.enterCalibration();
                expect(() => cycle.enterCalibration()).toThrow(invalid_review_cycle_state_exception_1.InvalidReviewCycleStateException);
                expect(() => cycle.enterCalibration()).toThrow('Cannot enter calibration from CALIBRATION status. Must be ACTIVE');
            });
            it('should throw error when entering calibration from COMPLETED status', () => {
                const props = createValidProps();
                const cycle = review_cycle_entity_1.ReviewCycle.create(props);
                cycle.start();
                cycle.enterCalibration();
                cycle.complete();
                expect(() => cycle.enterCalibration()).toThrow(invalid_review_cycle_state_exception_1.InvalidReviewCycleStateException);
                expect(() => cycle.enterCalibration()).toThrow('Cannot enter calibration from COMPLETED status. Must be ACTIVE');
            });
        });
        describe('complete', () => {
            it('should complete a cycle from CALIBRATION status', () => {
                const props = createValidProps();
                const cycle = review_cycle_entity_1.ReviewCycle.create(props);
                cycle.start();
                cycle.enterCalibration();
                expect(cycle.status).toBe(review_cycle_entity_1.CycleStatus.CALIBRATION);
                expect(cycle.endDate).toBeUndefined();
                const beforeComplete = new Date();
                cycle.complete();
                const afterComplete = new Date();
                expect(cycle.status).toBe(review_cycle_entity_1.CycleStatus.COMPLETED);
                expect(cycle.isCompleted).toBe(true);
                expect(cycle.endDate).toBeDefined();
                expect(cycle.endDate.getTime()).toBeGreaterThanOrEqual(beforeComplete.getTime());
                expect(cycle.endDate.getTime()).toBeLessThanOrEqual(afterComplete.getTime());
            });
            it('should throw error when completing from DRAFT status', () => {
                const props = createValidProps();
                const cycle = review_cycle_entity_1.ReviewCycle.create(props);
                expect(() => cycle.complete()).toThrow(invalid_review_cycle_state_exception_1.InvalidReviewCycleStateException);
                expect(() => cycle.complete()).toThrow('Cannot complete cycle from DRAFT status. Must be CALIBRATION');
            });
            it('should throw error when completing from ACTIVE status', () => {
                const props = createValidProps();
                const cycle = review_cycle_entity_1.ReviewCycle.create(props);
                cycle.start();
                expect(() => cycle.complete()).toThrow(invalid_review_cycle_state_exception_1.InvalidReviewCycleStateException);
                expect(() => cycle.complete()).toThrow('Cannot complete cycle from ACTIVE status. Must be CALIBRATION');
            });
            it('should throw error when completing from COMPLETED status', () => {
                const props = createValidProps();
                const cycle = review_cycle_entity_1.ReviewCycle.create(props);
                cycle.start();
                cycle.enterCalibration();
                cycle.complete();
                expect(() => cycle.complete()).toThrow(invalid_review_cycle_state_exception_1.InvalidReviewCycleStateException);
                expect(() => cycle.complete()).toThrow('Cannot complete cycle from COMPLETED status. Must be CALIBRATION');
            });
        });
        describe('hasDeadlinePassed', () => {
            it('should return false for future deadlines', () => {
                const props = createValidProps();
                const cycle = review_cycle_entity_1.ReviewCycle.create(props);
                expect(cycle.hasDeadlinePassed('selfReview')).toBe(false);
                expect(cycle.hasDeadlinePassed('peerFeedback')).toBe(false);
                expect(cycle.hasDeadlinePassed('managerEvaluation')).toBe(false);
                expect(cycle.hasDeadlinePassed('calibration')).toBe(false);
                expect(cycle.hasDeadlinePassed('feedbackDelivery')).toBe(false);
            });
            it('should return true for past deadlines', () => {
                const now = new Date();
                const pastDeadlines = cycle_deadlines_vo_1.CycleDeadlines.create({
                    selfReview: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000),
                    peerFeedback: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000),
                    managerEvaluation: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000),
                    calibration: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
                    feedbackDelivery: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
                });
                const cycle = review_cycle_entity_1.ReviewCycle.create({
                    name: 'Past Cycle',
                    year: 2023,
                    deadlines: pastDeadlines,
                });
                expect(cycle.hasDeadlinePassed('selfReview')).toBe(true);
                expect(cycle.hasDeadlinePassed('peerFeedback')).toBe(true);
                expect(cycle.hasDeadlinePassed('managerEvaluation')).toBe(true);
                expect(cycle.hasDeadlinePassed('calibration')).toBe(true);
                expect(cycle.hasDeadlinePassed('feedbackDelivery')).toBe(true);
            });
        });
        describe('getters', () => {
            it('should expose all properties via getters', () => {
                const props = createValidProps();
                const customId = review_cycle_id_vo_1.ReviewCycleId.generate();
                const customStartDate = new Date('2024-01-01');
                const cycle = review_cycle_entity_1.ReviewCycle.create({ ...props, id: customId, startDate: customStartDate });
                expect(cycle.id).toBe(customId);
                expect(cycle.name).toBe(props.name);
                expect(cycle.year).toBe(props.year);
                expect(cycle.status).toBe(review_cycle_entity_1.CycleStatus.DRAFT);
                expect(cycle.deadlines).toBe(props.deadlines);
                expect(cycle.startDate).toBe(customStartDate);
                expect(cycle.endDate).toBeUndefined();
            });
            it('should expose endDate after completion', () => {
                const props = createValidProps();
                const cycle = review_cycle_entity_1.ReviewCycle.create(props);
                expect(cycle.endDate).toBeUndefined();
                cycle.start();
                cycle.enterCalibration();
                cycle.complete();
                expect(cycle.endDate).toBeDefined();
                expect(cycle.endDate).toBeInstanceOf(Date);
            });
        });
        describe('isActive', () => {
            it('should return true for ACTIVE status', () => {
                const props = createValidProps();
                const cycle = review_cycle_entity_1.ReviewCycle.create(props);
                cycle.start();
                expect(cycle.isActive).toBe(true);
            });
            it('should return false for DRAFT status', () => {
                const props = createValidProps();
                const cycle = review_cycle_entity_1.ReviewCycle.create(props);
                expect(cycle.isActive).toBe(false);
            });
            it('should return false for CALIBRATION status', () => {
                const props = createValidProps();
                const cycle = review_cycle_entity_1.ReviewCycle.create(props);
                cycle.start();
                cycle.enterCalibration();
                expect(cycle.isActive).toBe(false);
            });
            it('should return false for COMPLETED status', () => {
                const props = createValidProps();
                const cycle = review_cycle_entity_1.ReviewCycle.create(props);
                cycle.start();
                cycle.enterCalibration();
                cycle.complete();
                expect(cycle.isActive).toBe(false);
            });
        });
        describe('isCompleted', () => {
            it('should return true for COMPLETED status', () => {
                const props = createValidProps();
                const cycle = review_cycle_entity_1.ReviewCycle.create(props);
                cycle.start();
                cycle.enterCalibration();
                cycle.complete();
                expect(cycle.isCompleted).toBe(true);
            });
            it('should return false for DRAFT status', () => {
                const props = createValidProps();
                const cycle = review_cycle_entity_1.ReviewCycle.create(props);
                expect(cycle.isCompleted).toBe(false);
            });
            it('should return false for ACTIVE status', () => {
                const props = createValidProps();
                const cycle = review_cycle_entity_1.ReviewCycle.create(props);
                cycle.start();
                expect(cycle.isCompleted).toBe(false);
            });
            it('should return false for CALIBRATION status', () => {
                const props = createValidProps();
                const cycle = review_cycle_entity_1.ReviewCycle.create(props);
                cycle.start();
                cycle.enterCalibration();
                expect(cycle.isCompleted).toBe(false);
            });
        });
        describe('state transition workflow', () => {
            it('should support complete lifecycle: DRAFT → ACTIVE → CALIBRATION → COMPLETED', () => {
                const props = createValidProps();
                const cycle = review_cycle_entity_1.ReviewCycle.create(props);
                expect(cycle.status).toBe(review_cycle_entity_1.CycleStatus.DRAFT);
                expect(cycle.isActive).toBe(false);
                expect(cycle.isCompleted).toBe(false);
                expect(cycle.endDate).toBeUndefined();
                cycle.start();
                expect(cycle.status).toBe(review_cycle_entity_1.CycleStatus.ACTIVE);
                expect(cycle.isActive).toBe(true);
                expect(cycle.isCompleted).toBe(false);
                cycle.enterCalibration();
                expect(cycle.status).toBe(review_cycle_entity_1.CycleStatus.CALIBRATION);
                expect(cycle.isActive).toBe(false);
                expect(cycle.isCompleted).toBe(false);
                cycle.complete();
                expect(cycle.status).toBe(review_cycle_entity_1.CycleStatus.COMPLETED);
                expect(cycle.isActive).toBe(false);
                expect(cycle.isCompleted).toBe(true);
                expect(cycle.endDate).toBeDefined();
            });
            it('should enforce valid state transitions only', () => {
                const props = createValidProps();
                const cycle = review_cycle_entity_1.ReviewCycle.create(props);
                expect(() => cycle.enterCalibration()).toThrow(invalid_review_cycle_state_exception_1.InvalidReviewCycleStateException);
                expect(() => cycle.complete()).toThrow(invalid_review_cycle_state_exception_1.InvalidReviewCycleStateException);
                cycle.start();
                expect(() => cycle.complete()).toThrow(invalid_review_cycle_state_exception_1.InvalidReviewCycleStateException);
                cycle.enterCalibration();
                cycle.complete();
                expect(() => cycle.start()).toThrow(invalid_review_cycle_state_exception_1.InvalidReviewCycleStateException);
                expect(() => cycle.enterCalibration()).toThrow(invalid_review_cycle_state_exception_1.InvalidReviewCycleStateException);
                expect(() => cycle.complete()).toThrow(invalid_review_cycle_state_exception_1.InvalidReviewCycleStateException);
            });
        });
        describe('edge cases', () => {
            it('should handle cycles for different years', () => {
                const deadlines = createValidDeadlines();
                const cycle2023 = review_cycle_entity_1.ReviewCycle.create({ name: 'Q4 2023', year: 2023, deadlines });
                const cycle2024 = review_cycle_entity_1.ReviewCycle.create({ name: 'Q1 2024', year: 2024, deadlines });
                const cycle2025 = review_cycle_entity_1.ReviewCycle.create({ name: 'Q2 2025', year: 2025, deadlines });
                expect(cycle2023.year).toBe(2023);
                expect(cycle2024.year).toBe(2024);
                expect(cycle2025.year).toBe(2025);
            });
            it('should handle cycles with same name but different years', () => {
                const deadlines = createValidDeadlines();
                const cycle1 = review_cycle_entity_1.ReviewCycle.create({ name: 'Annual Review', year: 2023, deadlines });
                const cycle2 = review_cycle_entity_1.ReviewCycle.create({ name: 'Annual Review', year: 2024, deadlines });
                expect(cycle1.name).toBe('Annual Review');
                expect(cycle2.name).toBe('Annual Review');
                expect(cycle1.year).not.toBe(cycle2.year);
                expect(cycle1.id).not.toBe(cycle2.id);
            });
            it('should handle very long cycle names', () => {
                const props = createValidProps();
                const longName = 'a'.repeat(1000);
                const cycle = review_cycle_entity_1.ReviewCycle.create({ ...props, name: longName });
                expect(cycle.name).toBe(longName);
                expect(cycle.name.length).toBe(1000);
            });
            it('should handle special characters in cycle names', () => {
                const props = createValidProps();
                const specialName = 'Q1-2024 (Performance Review) - Engineering & Design';
                const cycle = review_cycle_entity_1.ReviewCycle.create({ ...props, name: specialName });
                expect(cycle.name).toBe(specialName);
            });
        });
        describe('immutability', () => {
            it('should not allow modification of id after creation', () => {
                const props = createValidProps();
                const cycle = review_cycle_entity_1.ReviewCycle.create(props);
                const originalId = cycle.id;
                expect(cycle.id).toBe(originalId);
                expect(cycle.id).toBe(originalId);
            });
            it('should not allow modification of deadlines after creation', () => {
                const props = createValidProps();
                const cycle = review_cycle_entity_1.ReviewCycle.create(props);
                const originalDeadlines = cycle.deadlines;
                expect(cycle.deadlines).toBe(originalDeadlines);
                expect(cycle.deadlines).toBe(originalDeadlines);
            });
            it('should not allow modification of startDate after creation', () => {
                const props = createValidProps();
                const customStartDate = new Date('2024-01-01');
                const cycle = review_cycle_entity_1.ReviewCycle.create({ ...props, startDate: customStartDate });
                expect(cycle.startDate).toBe(customStartDate);
                expect(cycle.startDate).toBe(customStartDate);
            });
        });
    });
});
//# sourceMappingURL=review-cycle.entity.spec.js.map