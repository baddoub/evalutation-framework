export interface ReviewCycleDto {
    id: string;
    name: string;
    year: number;
    status: string;
    deadlines: {
        selfReview: Date;
        peerFeedback: Date;
        managerEvaluation: Date;
        calibration: Date;
        feedbackDelivery: Date;
    };
    startDate: Date;
    endDate?: Date;
}
export interface CreateReviewCycleInput {
    name: string;
    year: number;
    deadlines: {
        selfReview: Date;
        peerFeedback: Date;
        managerEvaluation: Date;
        calibration: Date;
        feedbackDelivery: Date;
    };
    startDate?: Date;
}
export interface CreateReviewCycleOutput {
    id: string;
    name: string;
    year: number;
    status: string;
    deadlines: {
        selfReview: Date;
        peerFeedback: Date;
        managerEvaluation: Date;
        calibration: Date;
        feedbackDelivery: Date;
    };
    startDate: Date;
    createdAt: Date;
}
export interface StartReviewCycleInput {
    cycleId: string;
}
export interface StartReviewCycleOutput {
    id: string;
    status: string;
    startedAt: Date;
}
export interface GetActiveCycleOutput {
    id: string;
    name: string;
    year: number;
    status: string;
    deadlines: {
        selfReview: Date;
        peerFeedback: Date;
        managerEvaluation: Date;
        calibration: Date;
        feedbackDelivery: Date;
    };
    startDate: Date;
}
