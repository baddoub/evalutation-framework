"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PeerFeedbackAggregationService = void 0;
const pillar_scores_vo_1 = require("../value-objects/pillar-scores.vo");
const no_peer_feedback_exception_1 = require("../exceptions/no-peer-feedback.exception");
class PeerFeedbackAggregationService {
    aggregatePeerScores(feedbacks) {
        if (!feedbacks || feedbacks.length === 0) {
            throw new no_peer_feedback_exception_1.NoPeerFeedbackException();
        }
        const sums = {
            projectImpact: 0,
            direction: 0,
            engineeringExcellence: 0,
            operationalOwnership: 0,
            peopleImpact: 0,
        };
        feedbacks.forEach((feedback) => {
            const scores = feedback.scores;
            sums.projectImpact += scores.projectImpact.value;
            sums.direction += scores.direction.value;
            sums.engineeringExcellence += scores.engineeringExcellence.value;
            sums.operationalOwnership += scores.operationalOwnership.value;
            sums.peopleImpact += scores.peopleImpact.value;
        });
        const count = feedbacks.length;
        return pillar_scores_vo_1.PillarScores.create({
            projectImpact: Math.round(sums.projectImpact / count),
            direction: Math.round(sums.direction / count),
            engineeringExcellence: Math.round(sums.engineeringExcellence / count),
            operationalOwnership: Math.round(sums.operationalOwnership / count),
            peopleImpact: Math.round(sums.peopleImpact / count),
        });
    }
    anonymizeFeedback(feedbacks) {
        if (!feedbacks || feedbacks.length === 0) {
            throw new no_peer_feedback_exception_1.NoPeerFeedbackException();
        }
        const averageScores = this.aggregatePeerScores(feedbacks);
        const strengths = [];
        const growthAreas = [];
        const general = [];
        feedbacks.forEach((feedback) => {
            if (feedback.strengths) {
                strengths.push(feedback.strengths);
            }
            if (feedback.growthAreas) {
                growthAreas.push(feedback.growthAreas);
            }
            if (feedback.generalComments) {
                general.push(feedback.generalComments);
            }
        });
        const comments = [];
        strengths.forEach((comment) => comments.push({ pillar: 'strengths', comment }));
        growthAreas.forEach((comment) => comments.push({ pillar: 'growthAreas', comment }));
        general.forEach((comment) => comments.push({ pillar: 'general', comment }));
        return {
            averageScores,
            feedbackCount: feedbacks.length,
            anonymizedComments: {
                strengths,
                growthAreas,
                general,
            },
            projectImpact: averageScores.projectImpact.value,
            direction: averageScores.direction.value,
            engineeringExcellence: averageScores.engineeringExcellence.value,
            operationalOwnership: averageScores.operationalOwnership.value,
            peopleImpact: averageScores.peopleImpact.value,
            comments,
        };
    }
    aggregateFeedback(feedbacks) {
        return this.anonymizeFeedback(feedbacks);
    }
}
exports.PeerFeedbackAggregationService = PeerFeedbackAggregationService;
//# sourceMappingURL=peer-feedback-aggregation.service.js.map