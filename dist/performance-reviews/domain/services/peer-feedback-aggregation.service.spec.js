"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const peer_feedback_aggregation_service_1 = require("./peer-feedback-aggregation.service");
const peer_feedback_entity_1 = require("../entities/peer-feedback.entity");
const pillar_scores_vo_1 = require("../value-objects/pillar-scores.vo");
const review_cycle_id_vo_1 = require("../value-objects/review-cycle-id.vo");
const user_id_vo_1 = require("../../../auth/domain/value-objects/user-id.vo");
const no_peer_feedback_exception_1 = require("../exceptions/no-peer-feedback.exception");
describe('PeerFeedbackAggregationService', () => {
    let service;
    beforeEach(() => {
        service = new peer_feedback_aggregation_service_1.PeerFeedbackAggregationService();
    });
    const createFeedback = (scores, comments) => {
        return peer_feedback_entity_1.PeerFeedback.create({
            cycleId: review_cycle_id_vo_1.ReviewCycleId.generate(),
            revieweeId: user_id_vo_1.UserId.generate(),
            reviewerId: user_id_vo_1.UserId.generate(),
            scores: pillar_scores_vo_1.PillarScores.create(scores),
            ...comments,
        });
    };
    describe('aggregatePeerScores', () => {
        it('should calculate average scores from single feedback', () => {
            const feedback = createFeedback({
                projectImpact: 3,
                direction: 2,
                engineeringExcellence: 4,
                operationalOwnership: 3,
                peopleImpact: 2,
            });
            const result = service.aggregatePeerScores([feedback]);
            expect(result.projectImpact.value).toBe(3);
            expect(result.direction.value).toBe(2);
            expect(result.engineeringExcellence.value).toBe(4);
            expect(result.operationalOwnership.value).toBe(3);
            expect(result.peopleImpact.value).toBe(2);
        });
        it('should calculate average scores from multiple feedbacks', () => {
            const feedbacks = [
                createFeedback({
                    projectImpact: 3,
                    direction: 2,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                }),
                createFeedback({
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 3,
                    operationalOwnership: 4,
                    peopleImpact: 3,
                }),
                createFeedback({
                    projectImpact: 2,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 2,
                    peopleImpact: 3,
                }),
            ];
            const result = service.aggregatePeerScores(feedbacks);
            expect(result.projectImpact.value).toBe(3);
            expect(result.direction.value).toBe(3);
            expect(result.engineeringExcellence.value).toBe(4);
            expect(result.operationalOwnership.value).toBe(3);
            expect(result.peopleImpact.value).toBe(3);
        });
        it('should round averages to nearest integer', () => {
            const feedbacks = [
                createFeedback({
                    projectImpact: 2,
                    direction: 2,
                    engineeringExcellence: 2,
                    operationalOwnership: 2,
                    peopleImpact: 2,
                }),
                createFeedback({
                    projectImpact: 3,
                    direction: 3,
                    engineeringExcellence: 3,
                    operationalOwnership: 3,
                    peopleImpact: 3,
                }),
            ];
            const result = service.aggregatePeerScores(feedbacks);
            expect(result.projectImpact.value).toBe(3);
            expect(result.direction.value).toBe(3);
            expect(result.engineeringExcellence.value).toBe(3);
            expect(result.operationalOwnership.value).toBe(3);
            expect(result.peopleImpact.value).toBe(3);
        });
        it('should handle all zeros', () => {
            const feedbacks = [
                createFeedback({
                    projectImpact: 0,
                    direction: 0,
                    engineeringExcellence: 0,
                    operationalOwnership: 0,
                    peopleImpact: 0,
                }),
                createFeedback({
                    projectImpact: 0,
                    direction: 0,
                    engineeringExcellence: 0,
                    operationalOwnership: 0,
                    peopleImpact: 0,
                }),
            ];
            const result = service.aggregatePeerScores(feedbacks);
            expect(result.projectImpact.value).toBe(0);
            expect(result.direction.value).toBe(0);
            expect(result.engineeringExcellence.value).toBe(0);
            expect(result.operationalOwnership.value).toBe(0);
            expect(result.peopleImpact.value).toBe(0);
        });
        it('should handle all max scores', () => {
            const feedbacks = [
                createFeedback({
                    projectImpact: 4,
                    direction: 4,
                    engineeringExcellence: 4,
                    operationalOwnership: 4,
                    peopleImpact: 4,
                }),
                createFeedback({
                    projectImpact: 4,
                    direction: 4,
                    engineeringExcellence: 4,
                    operationalOwnership: 4,
                    peopleImpact: 4,
                }),
            ];
            const result = service.aggregatePeerScores(feedbacks);
            expect(result.projectImpact.value).toBe(4);
            expect(result.direction.value).toBe(4);
            expect(result.engineeringExcellence.value).toBe(4);
            expect(result.operationalOwnership.value).toBe(4);
            expect(result.peopleImpact.value).toBe(4);
        });
        it('should throw error for empty feedbacks array', () => {
            expect(() => service.aggregatePeerScores([])).toThrow(no_peer_feedback_exception_1.NoPeerFeedbackException);
        });
        it('should throw error for null feedbacks', () => {
            expect(() => service.aggregatePeerScores(null)).toThrow(no_peer_feedback_exception_1.NoPeerFeedbackException);
        });
        it('should throw error for undefined feedbacks', () => {
            expect(() => service.aggregatePeerScores(undefined)).toThrow(no_peer_feedback_exception_1.NoPeerFeedbackException);
        });
    });
    describe('anonymizeFeedback', () => {
        it('should anonymize single feedback with all comments', () => {
            const feedback = createFeedback({
                projectImpact: 3,
                direction: 2,
                engineeringExcellence: 4,
                operationalOwnership: 3,
                peopleImpact: 2,
            }, {
                strengths: 'Great coding skills',
                growthAreas: 'Needs to improve communication',
                generalComments: 'Overall performing well',
            });
            const result = service.anonymizeFeedback([feedback]);
            expect(result.feedbackCount).toBe(1);
            expect(result.averageScores.projectImpact.value).toBe(3);
            expect(result.anonymizedComments.strengths).toEqual(['Great coding skills']);
            expect(result.anonymizedComments.growthAreas).toEqual([
                'Needs to improve communication',
            ]);
            expect(result.anonymizedComments.general).toEqual(['Overall performing well']);
            expect(result.projectImpact).toBe(3);
            expect(result.comments).toHaveLength(3);
        });
        it('should anonymize multiple feedbacks', () => {
            const feedbacks = [
                createFeedback({
                    projectImpact: 3,
                    direction: 2,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                }, {
                    strengths: 'Strong technical skills',
                    growthAreas: 'Work on leadership',
                }),
                createFeedback({
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 3,
                    operationalOwnership: 4,
                    peopleImpact: 3,
                }, {
                    strengths: 'Excellent problem solver',
                    generalComments: 'Keep up the good work',
                }),
                createFeedback({
                    projectImpact: 2,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 2,
                    peopleImpact: 3,
                }, {
                    growthAreas: 'Improve documentation',
                    generalComments: 'Good team player',
                }),
            ];
            const result = service.anonymizeFeedback(feedbacks);
            expect(result.feedbackCount).toBe(3);
            expect(result.anonymizedComments.strengths).toHaveLength(2);
            expect(result.anonymizedComments.growthAreas).toHaveLength(2);
            expect(result.anonymizedComments.general).toHaveLength(2);
            expect(result.comments).toHaveLength(6);
        });
        it('should handle feedbacks with no comments', () => {
            const feedback = createFeedback({
                projectImpact: 3,
                direction: 2,
                engineeringExcellence: 4,
                operationalOwnership: 3,
                peopleImpact: 2,
            });
            const result = service.anonymizeFeedback([feedback]);
            expect(result.anonymizedComments.strengths).toEqual([]);
            expect(result.anonymizedComments.growthAreas).toEqual([]);
            expect(result.anonymizedComments.general).toEqual([]);
            expect(result.comments).toHaveLength(0);
        });
        it('should include individual score properties for convenience', () => {
            const feedbacks = [
                createFeedback({
                    projectImpact: 3,
                    direction: 2,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                }),
                createFeedback({
                    projectImpact: 3,
                    direction: 2,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                }),
            ];
            const result = service.anonymizeFeedback(feedbacks);
            expect(result.projectImpact).toBe(3);
            expect(result.direction).toBe(2);
            expect(result.engineeringExcellence).toBe(4);
            expect(result.operationalOwnership).toBe(3);
            expect(result.peopleImpact).toBe(2);
        });
        it('should flatten comments into array with pillar labels', () => {
            const feedback = createFeedback({
                projectImpact: 3,
                direction: 2,
                engineeringExcellence: 4,
                operationalOwnership: 3,
                peopleImpact: 2,
            }, {
                strengths: 'Good coder',
                growthAreas: 'Learn more',
                generalComments: 'Nice person',
            });
            const result = service.anonymizeFeedback([feedback]);
            expect(result.comments).toEqual([
                { pillar: 'strengths', comment: 'Good coder' },
                { pillar: 'growthAreas', comment: 'Learn more' },
                { pillar: 'general', comment: 'Nice person' },
            ]);
        });
        it('should throw error for empty feedbacks array', () => {
            expect(() => service.anonymizeFeedback([])).toThrow(no_peer_feedback_exception_1.NoPeerFeedbackException);
        });
        it('should throw error for null feedbacks', () => {
            expect(() => service.anonymizeFeedback(null)).toThrow(no_peer_feedback_exception_1.NoPeerFeedbackException);
        });
    });
    describe('aggregateFeedback', () => {
        it('should be an alias for anonymizeFeedback', () => {
            const feedback = createFeedback({
                projectImpact: 3,
                direction: 2,
                engineeringExcellence: 4,
                operationalOwnership: 3,
                peopleImpact: 2,
            }, {
                strengths: 'Great work',
            });
            const anonymizedResult = service.anonymizeFeedback([feedback]);
            const aggregatedResult = service.aggregateFeedback([feedback]);
            expect(aggregatedResult).toEqual(anonymizedResult);
        });
    });
    describe('edge cases', () => {
        it('should handle large number of feedbacks', () => {
            const feedbacks = Array.from({ length: 100 }, () => createFeedback({
                projectImpact: 3,
                direction: 3,
                engineeringExcellence: 3,
                operationalOwnership: 3,
                peopleImpact: 3,
            }));
            const result = service.aggregatePeerScores(feedbacks);
            expect(result.projectImpact.value).toBe(3);
            expect(result.direction.value).toBe(3);
            expect(result.engineeringExcellence.value).toBe(3);
            expect(result.operationalOwnership.value).toBe(3);
            expect(result.peopleImpact.value).toBe(3);
        });
        it('should handle mixed partial comments', () => {
            const feedbacks = [
                createFeedback({
                    projectImpact: 3,
                    direction: 2,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                }, {
                    strengths: 'Comment 1',
                }),
                createFeedback({
                    projectImpact: 3,
                    direction: 2,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                }, {
                    growthAreas: 'Comment 2',
                }),
                createFeedback({
                    projectImpact: 3,
                    direction: 2,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                }, {
                    generalComments: 'Comment 3',
                }),
            ];
            const result = service.anonymizeFeedback(feedbacks);
            expect(result.anonymizedComments.strengths).toHaveLength(1);
            expect(result.anonymizedComments.growthAreas).toHaveLength(1);
            expect(result.anonymizedComments.general).toHaveLength(1);
            expect(result.comments).toHaveLength(3);
        });
    });
});
//# sourceMappingURL=peer-feedback-aggregation.service.spec.js.map