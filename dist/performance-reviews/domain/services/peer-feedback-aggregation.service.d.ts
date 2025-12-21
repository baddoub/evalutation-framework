import { PeerFeedback } from '../entities/peer-feedback.entity';
import { PillarScores } from '../value-objects/pillar-scores.vo';
export interface AnonymizedPeerFeedback {
    averageScores: PillarScores;
    feedbackCount: number;
    anonymizedComments: {
        strengths: string[];
        growthAreas: string[];
        general: string[];
    };
    projectImpact: number;
    direction: number;
    engineeringExcellence: number;
    operationalOwnership: number;
    peopleImpact: number;
    comments: Array<{
        pillar: string;
        comment: string;
    }>;
}
export declare class PeerFeedbackAggregationService {
    aggregatePeerScores(feedbacks: PeerFeedback[]): PillarScores;
    anonymizeFeedback(feedbacks: PeerFeedback[]): AnonymizedPeerFeedback;
    aggregateFeedback(feedbacks: PeerFeedback[]): AnonymizedPeerFeedback;
}
