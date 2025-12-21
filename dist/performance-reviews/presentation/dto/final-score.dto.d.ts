export declare class DeliverFeedbackRequestDto {
    feedbackNotes: string;
}
export declare class FinalScoreResponseDto {
    id: string;
    cycleId: string;
    employeeId: string;
    weightedScore: number;
    percentageScore: number;
    bonusTier: string;
    feedbackNotes?: string;
    deliveredAt: string | null;
    deliveredBy: string | null;
    createdAt: string;
    updatedAt: string;
}
export declare class ScoreAdjustmentRequestDto {
    newWeightedScore: number;
    reason: string;
    proposedScores: {
        projectImpact: number;
        direction: number;
        engineeringExcellence: number;
        operationalOwnership: number;
        peopleImpact: number;
    };
}
export declare class ScoreAdjustmentResponseDto {
    id: string;
    finalScoreId: string;
    previousScore: number;
    requestedScore: number;
    reason: string;
    status: string;
    requestedBy: string;
    reviewedAt: string | null;
    reviewNotes: string | null;
    requestedAt: string;
    reviewedBy: string | null;
}
