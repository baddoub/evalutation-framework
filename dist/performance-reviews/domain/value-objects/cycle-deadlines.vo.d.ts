export declare class CycleDeadlines {
    private readonly _selfReview;
    private readonly _peerFeedback;
    private readonly _managerEvaluation;
    private readonly _calibration;
    private readonly _feedbackDelivery;
    private constructor();
    static create(deadlines: {
        selfReview: Date;
        peerFeedback: Date;
        managerEvaluation: Date;
        calibration: Date;
        feedbackDelivery: Date;
    }): CycleDeadlines;
    private validateDeadlineOrder;
    get selfReview(): Date;
    get peerFeedback(): Date;
    get managerEvaluation(): Date;
    get calibration(): Date;
    get feedbackDelivery(): Date;
    hasPassedDeadline(phase: 'selfReview' | 'peerFeedback' | 'managerEvaluation' | 'calibration' | 'feedbackDelivery'): boolean;
    toObject(): {
        selfReview: Date;
        peerFeedback: Date;
        managerEvaluation: Date;
        calibration: Date;
        feedbackDelivery: Date;
    };
}
