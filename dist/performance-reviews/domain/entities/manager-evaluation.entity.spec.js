"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const manager_evaluation_entity_1 = require("./manager-evaluation.entity");
const manager_evaluation_id_vo_1 = require("../value-objects/manager-evaluation-id.vo");
const review_cycle_id_vo_1 = require("../value-objects/review-cycle-id.vo");
const user_id_vo_1 = require("../../../auth/domain/value-objects/user-id.vo");
const pillar_scores_vo_1 = require("../value-objects/pillar-scores.vo");
const narrative_vo_1 = require("../value-objects/narrative.vo");
const engineer_level_vo_1 = require("../value-objects/engineer-level.vo");
const review_status_vo_1 = require("../value-objects/review-status.vo");
const manager_evaluation_already_submitted_exception_1 = require("../exceptions/manager-evaluation-already-submitted.exception");
describe('ManagerEvaluation', () => {
    const createValidProps = () => ({
        cycleId: review_cycle_id_vo_1.ReviewCycleId.generate(),
        employeeId: user_id_vo_1.UserId.generate(),
        managerId: user_id_vo_1.UserId.generate(),
        scores: pillar_scores_vo_1.PillarScores.create({
            projectImpact: 3,
            direction: 2,
            engineeringExcellence: 4,
            operationalOwnership: 3,
            peopleImpact: 2,
        }),
        narrative: 'Employee has shown strong technical skills',
        strengths: 'Excellent problem-solving and collaboration',
        growthAreas: 'Could improve in technical leadership',
        developmentPlan: 'Focus on mentoring junior engineers',
    });
    describe('create', () => {
        it('should create a ManagerEvaluation with required properties in DRAFT status', () => {
            const props = createValidProps();
            const beforeCreate = new Date();
            const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create(props);
            const afterCreate = new Date();
            expect(evaluation).toBeInstanceOf(manager_evaluation_entity_1.ManagerEvaluation);
            expect(evaluation.id).toBeInstanceOf(manager_evaluation_id_vo_1.ManagerEvaluationId);
            expect(evaluation.cycleId).toBe(props.cycleId);
            expect(evaluation.employeeId).toBe(props.employeeId);
            expect(evaluation.managerId).toBe(props.managerId);
            expect(evaluation.scores).toBe(props.scores);
            expect(evaluation.narrative).toBe(props.narrative);
            expect(evaluation.strengths).toBe(props.strengths);
            expect(evaluation.growthAreas).toBe(props.growthAreas);
            expect(evaluation.developmentPlan).toBe(props.developmentPlan);
            expect(evaluation.status).toBe(review_status_vo_1.ReviewStatus.DRAFT);
            expect(evaluation.submittedAt).toBeUndefined();
            expect(evaluation.calibratedAt).toBeUndefined();
            expect(evaluation.createdAt).toBeDefined();
            expect(evaluation.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
            expect(evaluation.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
            expect(evaluation.updatedAt).toBeDefined();
            expect(evaluation.isSubmitted).toBe(false);
            expect(evaluation.isCalibrated).toBe(false);
        });
        it('should create a ManagerEvaluation with provided id', () => {
            const props = createValidProps();
            const customId = manager_evaluation_id_vo_1.ManagerEvaluationId.generate();
            const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create({ ...props, id: customId });
            expect(evaluation.id).toBe(customId);
        });
        it('should create a ManagerEvaluation with optional employee level', () => {
            const props = createValidProps();
            const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create({
                ...props,
                employeeLevel: engineer_level_vo_1.EngineerLevel.SENIOR,
            });
            expect(evaluation.employeeLevel).toBe(engineer_level_vo_1.EngineerLevel.SENIOR);
        });
        it('should create a ManagerEvaluation with optional proposed level', () => {
            const props = createValidProps();
            const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create({
                ...props,
                proposedLevel: engineer_level_vo_1.EngineerLevel.LEAD,
            });
            expect(evaluation.proposedLevel).toBe(engineer_level_vo_1.EngineerLevel.LEAD);
        });
        it('should create a ManagerEvaluation with optional performance narrative', () => {
            const props = createValidProps();
            const performanceNarrative = 'Exceeded expectations in all areas';
            const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create({
                ...props,
                performanceNarrative,
            });
            expect(evaluation.performanceNarrative).toBe(performanceNarrative);
        });
        it('should create a ManagerEvaluation with all optional fields', () => {
            const props = createValidProps();
            const performanceNarrative = 'Outstanding performance';
            const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create({
                ...props,
                employeeLevel: engineer_level_vo_1.EngineerLevel.SENIOR,
                proposedLevel: engineer_level_vo_1.EngineerLevel.LEAD,
                performanceNarrative,
            });
            expect(evaluation.employeeLevel).toBe(engineer_level_vo_1.EngineerLevel.SENIOR);
            expect(evaluation.proposedLevel).toBe(engineer_level_vo_1.EngineerLevel.LEAD);
            expect(evaluation.performanceNarrative).toBe(performanceNarrative);
        });
        it('should create a ManagerEvaluation with custom timestamps', () => {
            const props = createValidProps();
            const customCreatedAt = new Date('2024-01-01');
            const customUpdatedAt = new Date('2024-01-02');
            const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create({
                ...props,
                createdAt: customCreatedAt,
                updatedAt: customUpdatedAt,
            });
            expect(evaluation.createdAt).toBe(customCreatedAt);
            expect(evaluation.updatedAt).toBe(customUpdatedAt);
        });
        it('should create multiple ManagerEvaluations with unique ids', () => {
            const props = createValidProps();
            const evaluation1 = manager_evaluation_entity_1.ManagerEvaluation.create(props);
            const evaluation2 = manager_evaluation_entity_1.ManagerEvaluation.create(props);
            expect(evaluation1.id).not.toBe(evaluation2.id);
        });
    });
    describe('updateScores', () => {
        it('should update scores when in DRAFT status', () => {
            const props = createValidProps();
            const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create(props);
            const originalUpdatedAt = evaluation.updatedAt;
            const newScores = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 4,
                direction: 3,
                engineeringExcellence: 4,
                operationalOwnership: 4,
                peopleImpact: 3,
            });
            const beforeUpdate = new Date();
            evaluation.updateScores(newScores);
            expect(evaluation.scores).toBe(newScores);
            expect(evaluation.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
            expect(evaluation.updatedAt).not.toBe(originalUpdatedAt);
        });
        it('should throw error when updating scores after submission', () => {
            const props = createValidProps();
            const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create(props);
            evaluation.submit();
            const newScores = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 4,
                direction: 4,
                engineeringExcellence: 4,
                operationalOwnership: 4,
                peopleImpact: 4,
            });
            expect(() => evaluation.updateScores(newScores)).toThrow(manager_evaluation_already_submitted_exception_1.ManagerEvaluationAlreadySubmittedException);
            expect(() => evaluation.updateScores(newScores)).toThrow('Cannot update scores after submission');
        });
        it('should allow multiple score updates while in DRAFT status', () => {
            const props = createValidProps();
            const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create(props);
            const scores1 = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 1,
                direction: 1,
                engineeringExcellence: 1,
                operationalOwnership: 1,
                peopleImpact: 1,
            });
            const scores2 = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 2,
                direction: 2,
                engineeringExcellence: 2,
                operationalOwnership: 2,
                peopleImpact: 2,
            });
            evaluation.updateScores(scores1);
            expect(evaluation.scores).toBe(scores1);
            evaluation.updateScores(scores2);
            expect(evaluation.scores).toBe(scores2);
        });
    });
    describe('submit', () => {
        it('should submit an evaluation in DRAFT status', () => {
            const props = createValidProps();
            const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create(props);
            const beforeSubmit = new Date();
            evaluation.submit();
            expect(evaluation.status).toBe(review_status_vo_1.ReviewStatus.SUBMITTED);
            expect(evaluation.submittedAt).toBeDefined();
            expect(evaluation.submittedAt.getTime()).toBeGreaterThanOrEqual(beforeSubmit.getTime());
            expect(evaluation.isSubmitted).toBe(true);
            expect(evaluation.isCalibrated).toBe(false);
        });
        it('should update updatedAt timestamp on submission', () => {
            const props = createValidProps();
            const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create(props);
            const originalUpdatedAt = evaluation.updatedAt;
            const beforeSubmit = new Date();
            evaluation.submit();
            expect(evaluation.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeSubmit.getTime());
            expect(evaluation.updatedAt).not.toBe(originalUpdatedAt);
        });
        it('should throw error when submitting already submitted evaluation', () => {
            const props = createValidProps();
            const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create(props);
            evaluation.submit();
            expect(() => evaluation.submit()).toThrow(manager_evaluation_already_submitted_exception_1.ManagerEvaluationAlreadySubmittedException);
        });
        it('should prevent updates after submission', () => {
            const props = createValidProps();
            const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create(props);
            evaluation.submit();
            const newScores = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 4,
                direction: 4,
                engineeringExcellence: 4,
                operationalOwnership: 4,
                peopleImpact: 4,
            });
            const newNarrative = narrative_vo_1.Narrative.create('New performance narrative');
            const newGrowthAreas = narrative_vo_1.Narrative.create('New growth areas');
            expect(() => evaluation.updateScores(newScores)).toThrow(manager_evaluation_already_submitted_exception_1.ManagerEvaluationAlreadySubmittedException);
            expect(() => evaluation.updatePerformanceNarrative(newNarrative)).toThrow(manager_evaluation_already_submitted_exception_1.ManagerEvaluationAlreadySubmittedException);
            expect(() => evaluation.updateGrowthAreas(newGrowthAreas)).toThrow(manager_evaluation_already_submitted_exception_1.ManagerEvaluationAlreadySubmittedException);
            expect(() => evaluation.updateProposedLevel(engineer_level_vo_1.EngineerLevel.LEAD)).toThrow(manager_evaluation_already_submitted_exception_1.ManagerEvaluationAlreadySubmittedException);
        });
    });
    describe('calibrate', () => {
        it('should calibrate a submitted evaluation', () => {
            const props = createValidProps();
            const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create(props);
            evaluation.submit();
            const beforeCalibrate = new Date();
            evaluation.calibrate();
            expect(evaluation.status).toBe(review_status_vo_1.ReviewStatus.CALIBRATED);
            expect(evaluation.calibratedAt).toBeDefined();
            expect(evaluation.calibratedAt.getTime()).toBeGreaterThanOrEqual(beforeCalibrate.getTime());
            expect(evaluation.isCalibrated).toBe(true);
            expect(evaluation.isSubmitted).toBe(true);
        });
        it('should update updatedAt timestamp on calibration', () => {
            const props = createValidProps();
            const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create(props);
            evaluation.submit();
            const submittedUpdatedAt = evaluation.updatedAt;
            const beforeCalibrate = new Date();
            evaluation.calibrate();
            expect(evaluation.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCalibrate.getTime());
            expect(evaluation.updatedAt).not.toBe(submittedUpdatedAt);
        });
        it('should throw error when calibrating unsubmitted evaluation', () => {
            const props = createValidProps();
            const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create(props);
            expect(() => evaluation.calibrate()).toThrow('Cannot calibrate evaluation that has not been submitted');
        });
    });
    describe('applyCalibrationAdjustment', () => {
        it('should apply calibration adjustment to submitted evaluation', () => {
            const props = createValidProps();
            const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create(props);
            evaluation.submit();
            const newScores = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 4,
                direction: 4,
                engineeringExcellence: 4,
                operationalOwnership: 4,
                peopleImpact: 4,
            });
            const justification = 'Calibration committee adjusted scores upward';
            const beforeAdjustment = new Date();
            evaluation.applyCalibrationAdjustment(newScores, justification);
            expect(evaluation.scores).toBe(newScores);
            expect(evaluation.status).toBe(review_status_vo_1.ReviewStatus.CALIBRATED);
            expect(evaluation.isCalibrated).toBe(true);
            expect(evaluation.calibratedAt).toBeDefined();
            expect(evaluation.calibratedAt.getTime()).toBeGreaterThanOrEqual(beforeAdjustment.getTime());
            expect(evaluation.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeAdjustment.getTime());
        });
        it('should throw error when applying calibration to unsubmitted evaluation', () => {
            const props = createValidProps();
            const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create(props);
            const newScores = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 4,
                direction: 4,
                engineeringExcellence: 4,
                operationalOwnership: 4,
                peopleImpact: 4,
            });
            expect(() => evaluation.applyCalibrationAdjustment(newScores, 'justification')).toThrow('Cannot apply calibration to unsubmitted evaluation');
        });
        it('should allow multiple calibration adjustments', () => {
            const props = createValidProps();
            const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create(props);
            evaluation.submit();
            const adjustment1 = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 3,
                direction: 3,
                engineeringExcellence: 3,
                operationalOwnership: 3,
                peopleImpact: 3,
            });
            const adjustment2 = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 4,
                direction: 4,
                engineeringExcellence: 4,
                operationalOwnership: 4,
                peopleImpact: 4,
            });
            evaluation.applyCalibrationAdjustment(adjustment1, 'First adjustment');
            expect(evaluation.scores).toBe(adjustment1);
            evaluation.applyCalibrationAdjustment(adjustment2, 'Second adjustment');
            expect(evaluation.scores).toBe(adjustment2);
        });
    });
    describe('updatePerformanceNarrative', () => {
        it('should update performance narrative when in DRAFT status', () => {
            const props = createValidProps();
            const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create(props);
            const newNarrative = narrative_vo_1.Narrative.create('Updated performance narrative text');
            const beforeUpdate = new Date();
            evaluation.updatePerformanceNarrative(newNarrative);
            expect(evaluation.performanceNarrative).toBe(newNarrative.text);
            expect(evaluation.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
        });
        it('should throw error when updating performance narrative after submission', () => {
            const props = createValidProps();
            const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create(props);
            evaluation.submit();
            const newNarrative = narrative_vo_1.Narrative.create('Updated narrative');
            expect(() => evaluation.updatePerformanceNarrative(newNarrative)).toThrow(manager_evaluation_already_submitted_exception_1.ManagerEvaluationAlreadySubmittedException);
            expect(() => evaluation.updatePerformanceNarrative(newNarrative)).toThrow('Cannot update performance narrative after submission');
        });
    });
    describe('updateGrowthAreas', () => {
        it('should update growth areas when in DRAFT status', () => {
            const props = createValidProps();
            const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create(props);
            const newGrowthAreas = narrative_vo_1.Narrative.create('Updated growth areas text');
            const beforeUpdate = new Date();
            evaluation.updateGrowthAreas(newGrowthAreas);
            expect(evaluation.growthAreas).toBe(newGrowthAreas.text);
            expect(evaluation.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
        });
        it('should throw error when updating growth areas after submission', () => {
            const props = createValidProps();
            const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create(props);
            evaluation.submit();
            const newGrowthAreas = narrative_vo_1.Narrative.create('Updated growth areas');
            expect(() => evaluation.updateGrowthAreas(newGrowthAreas)).toThrow(manager_evaluation_already_submitted_exception_1.ManagerEvaluationAlreadySubmittedException);
            expect(() => evaluation.updateGrowthAreas(newGrowthAreas)).toThrow('Cannot update growth areas after submission');
        });
    });
    describe('updateProposedLevel', () => {
        it('should update proposed level when in DRAFT status', () => {
            const props = createValidProps();
            const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create(props);
            const beforeUpdate = new Date();
            evaluation.updateProposedLevel(engineer_level_vo_1.EngineerLevel.LEAD);
            expect(evaluation.proposedLevel).toBe(engineer_level_vo_1.EngineerLevel.LEAD);
            expect(evaluation.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
        });
        it('should throw error when updating proposed level after submission', () => {
            const props = createValidProps();
            const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create(props);
            evaluation.submit();
            expect(() => evaluation.updateProposedLevel(engineer_level_vo_1.EngineerLevel.LEAD)).toThrow(manager_evaluation_already_submitted_exception_1.ManagerEvaluationAlreadySubmittedException);
            expect(() => evaluation.updateProposedLevel(engineer_level_vo_1.EngineerLevel.LEAD)).toThrow('Cannot update proposed level after submission');
        });
        it('should allow updating proposed level multiple times in DRAFT', () => {
            const props = createValidProps();
            const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create(props);
            evaluation.updateProposedLevel(engineer_level_vo_1.EngineerLevel.LEAD);
            expect(evaluation.proposedLevel).toBe(engineer_level_vo_1.EngineerLevel.LEAD);
            evaluation.updateProposedLevel(engineer_level_vo_1.EngineerLevel.SENIOR);
            expect(evaluation.proposedLevel).toBe(engineer_level_vo_1.EngineerLevel.SENIOR);
            evaluation.updateProposedLevel(engineer_level_vo_1.EngineerLevel.MANAGER);
            expect(evaluation.proposedLevel).toBe(engineer_level_vo_1.EngineerLevel.MANAGER);
        });
    });
    describe('getters', () => {
        it('should expose all properties via getters', () => {
            const props = createValidProps();
            const customId = manager_evaluation_id_vo_1.ManagerEvaluationId.generate();
            const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create({
                ...props,
                id: customId,
                employeeLevel: engineer_level_vo_1.EngineerLevel.SENIOR,
                proposedLevel: engineer_level_vo_1.EngineerLevel.LEAD,
                performanceNarrative: 'Excellent performance',
            });
            expect(evaluation.id).toBe(customId);
            expect(evaluation.cycleId).toBe(props.cycleId);
            expect(evaluation.employeeId).toBe(props.employeeId);
            expect(evaluation.managerId).toBe(props.managerId);
            expect(evaluation.scores).toBe(props.scores);
            expect(evaluation.narrative).toBe(props.narrative);
            expect(evaluation.strengths).toBe(props.strengths);
            expect(evaluation.growthAreas).toBe(props.growthAreas);
            expect(evaluation.developmentPlan).toBe(props.developmentPlan);
            expect(evaluation.status).toBe(review_status_vo_1.ReviewStatus.DRAFT);
            expect(evaluation.employeeLevel).toBe(engineer_level_vo_1.EngineerLevel.SENIOR);
            expect(evaluation.proposedLevel).toBe(engineer_level_vo_1.EngineerLevel.LEAD);
            expect(evaluation.performanceNarrative).toBe('Excellent performance');
            expect(evaluation.submittedAt).toBeUndefined();
            expect(evaluation.calibratedAt).toBeUndefined();
            expect(evaluation.createdAt).toBeDefined();
            expect(evaluation.updatedAt).toBeDefined();
        });
        it('should return undefined for optional properties when not provided', () => {
            const props = createValidProps();
            const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create(props);
            expect(evaluation.employeeLevel).toBeUndefined();
            expect(evaluation.proposedLevel).toBeUndefined();
            expect(evaluation.performanceNarrative).toBeUndefined();
        });
    });
    describe('isSubmitted', () => {
        it('should return false for DRAFT status', () => {
            const props = createValidProps();
            const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create(props);
            expect(evaluation.isSubmitted).toBe(false);
        });
        it('should return true for SUBMITTED status', () => {
            const props = createValidProps();
            const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create(props);
            evaluation.submit();
            expect(evaluation.isSubmitted).toBe(true);
        });
        it('should return true for CALIBRATED status', () => {
            const props = createValidProps();
            const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create(props);
            evaluation.submit();
            evaluation.calibrate();
            expect(evaluation.isSubmitted).toBe(true);
        });
    });
    describe('isCalibrated', () => {
        it('should return false for DRAFT status', () => {
            const props = createValidProps();
            const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create(props);
            expect(evaluation.isCalibrated).toBe(false);
        });
        it('should return false for SUBMITTED status', () => {
            const props = createValidProps();
            const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create(props);
            evaluation.submit();
            expect(evaluation.isCalibrated).toBe(false);
        });
        it('should return true for CALIBRATED status', () => {
            const props = createValidProps();
            const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create(props);
            evaluation.submit();
            evaluation.calibrate();
            expect(evaluation.isCalibrated).toBe(true);
        });
    });
    describe('workflow scenarios', () => {
        it('should support full draft-to-calibration workflow', () => {
            const props = createValidProps();
            const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create(props);
            expect(evaluation.status).toBe(review_status_vo_1.ReviewStatus.DRAFT);
            expect(evaluation.isSubmitted).toBe(false);
            expect(evaluation.isCalibrated).toBe(false);
            const scores1 = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 2,
                direction: 2,
                engineeringExcellence: 2,
                operationalOwnership: 2,
                peopleImpact: 2,
            });
            evaluation.updateScores(scores1);
            evaluation.updateProposedLevel(engineer_level_vo_1.EngineerLevel.SENIOR);
            const narrative = narrative_vo_1.Narrative.create('Updated performance narrative');
            evaluation.updatePerformanceNarrative(narrative);
            const growthAreas = narrative_vo_1.Narrative.create('Focus on technical leadership');
            evaluation.updateGrowthAreas(growthAreas);
            evaluation.submit();
            expect(evaluation.status).toBe(review_status_vo_1.ReviewStatus.SUBMITTED);
            expect(evaluation.isSubmitted).toBe(true);
            expect(evaluation.isCalibrated).toBe(false);
            expect(evaluation.submittedAt).toBeDefined();
            const calibratedScores = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 3,
                direction: 3,
                engineeringExcellence: 3,
                operationalOwnership: 3,
                peopleImpact: 3,
            });
            evaluation.applyCalibrationAdjustment(calibratedScores, 'Adjusted after committee review');
            expect(evaluation.status).toBe(review_status_vo_1.ReviewStatus.CALIBRATED);
            expect(evaluation.isSubmitted).toBe(true);
            expect(evaluation.isCalibrated).toBe(true);
            expect(evaluation.calibratedAt).toBeDefined();
            expect(evaluation.scores).toBe(calibratedScores);
        });
        it('should maintain immutability of submitted data except during calibration', () => {
            const props = createValidProps();
            const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create(props);
            const originalScores = props.scores;
            evaluation.submit();
            expect(evaluation.scores).toBe(originalScores);
            const newScores = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 4,
                direction: 4,
                engineeringExcellence: 4,
                operationalOwnership: 4,
                peopleImpact: 4,
            });
            expect(() => evaluation.updateScores(newScores)).toThrow();
            evaluation.applyCalibrationAdjustment(newScores, 'Calibration adjustment');
            expect(evaluation.scores).toBe(newScores);
            expect(evaluation.scores).not.toBe(originalScores);
        });
    });
    describe('edge cases', () => {
        it('should handle all zero scores', () => {
            const props = createValidProps();
            const zeroScores = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 0,
                direction: 0,
                engineeringExcellence: 0,
                operationalOwnership: 0,
                peopleImpact: 0,
            });
            const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create({ ...props, scores: zeroScores });
            expect(evaluation.scores).toBe(zeroScores);
        });
        it('should handle maximum scores', () => {
            const props = createValidProps();
            const maxScores = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 4,
                direction: 4,
                engineeringExcellence: 4,
                operationalOwnership: 4,
                peopleImpact: 4,
            });
            const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create({ ...props, scores: maxScores });
            expect(evaluation.scores).toBe(maxScores);
        });
        it('should handle all engineer levels', () => {
            const props = createValidProps();
            const levels = [
                engineer_level_vo_1.EngineerLevel.JUNIOR,
                engineer_level_vo_1.EngineerLevel.MID,
                engineer_level_vo_1.EngineerLevel.SENIOR,
                engineer_level_vo_1.EngineerLevel.LEAD,
                engineer_level_vo_1.EngineerLevel.MANAGER,
            ];
            levels.forEach((level) => {
                const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create({
                    ...props,
                    employeeLevel: level,
                    proposedLevel: level,
                });
                expect(evaluation.employeeLevel).toBe(level);
                expect(evaluation.proposedLevel).toBe(level);
            });
        });
        it('should handle level promotions', () => {
            const props = createValidProps();
            const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create({
                ...props,
                employeeLevel: engineer_level_vo_1.EngineerLevel.MID,
                proposedLevel: engineer_level_vo_1.EngineerLevel.SENIOR,
            });
            expect(evaluation.employeeLevel).toBe(engineer_level_vo_1.EngineerLevel.MID);
            expect(evaluation.proposedLevel).toBe(engineer_level_vo_1.EngineerLevel.SENIOR);
        });
        it('should handle very long text fields', () => {
            const props = createValidProps();
            const longText = 'a'.repeat(10000);
            const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create({
                ...props,
                narrative: longText,
                strengths: longText,
                growthAreas: longText,
                developmentPlan: longText,
                performanceNarrative: longText,
            });
            expect(evaluation.narrative).toBe(longText);
            expect(evaluation.strengths).toBe(longText);
            expect(evaluation.growthAreas).toBe(longText);
            expect(evaluation.developmentPlan).toBe(longText);
            expect(evaluation.performanceNarrative).toBe(longText);
        });
        it('should handle empty strings for text fields', () => {
            const props = createValidProps();
            const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create({
                ...props,
                narrative: '',
                strengths: '',
                growthAreas: '',
                developmentPlan: '',
                performanceNarrative: '',
            });
            expect(evaluation.narrative).toBe('');
            expect(evaluation.strengths).toBe('');
            expect(evaluation.growthAreas).toBe('');
            expect(evaluation.developmentPlan).toBe('');
            expect(evaluation.performanceNarrative).toBe('');
        });
    });
    describe('timestamp management', () => {
        it('should set createdAt and updatedAt on creation', () => {
            const props = createValidProps();
            const beforeCreate = new Date();
            const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create(props);
            const afterCreate = new Date();
            expect(evaluation.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
            expect(evaluation.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
            expect(evaluation.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
            expect(evaluation.updatedAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
        });
        it('should update updatedAt on score updates', () => {
            const props = createValidProps();
            const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create(props);
            const originalUpdatedAt = evaluation.updatedAt;
            const newScores = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 4,
                direction: 4,
                engineeringExcellence: 4,
                operationalOwnership: 4,
                peopleImpact: 4,
            });
            evaluation.updateScores(newScores);
            expect(evaluation.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
        });
        it('should not modify createdAt after updates', () => {
            const props = createValidProps();
            const evaluation = manager_evaluation_entity_1.ManagerEvaluation.create(props);
            const originalCreatedAt = evaluation.createdAt;
            const newScores = pillar_scores_vo_1.PillarScores.create({
                projectImpact: 4,
                direction: 4,
                engineeringExcellence: 4,
                operationalOwnership: 4,
                peopleImpact: 4,
            });
            evaluation.updateScores(newScores);
            evaluation.submit();
            evaluation.calibrate();
            expect(evaluation.createdAt).toBe(originalCreatedAt);
        });
    });
});
//# sourceMappingURL=manager-evaluation.entity.spec.js.map