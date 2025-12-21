export declare enum ReviewCycleStatusDto {
    DRAFT = "DRAFT",
    ACTIVE = "ACTIVE",
    CALIBRATING = "CALIBRATING",
    COMPLETED = "COMPLETED",
    CLOSED = "CLOSED"
}
export declare class CreateReviewCycleRequestDto {
    name: string;
    year: number;
    selfReviewDeadline: string;
    peerFeedbackDeadline: string;
    managerEvalDeadline: string;
    calibrationDeadline: string;
    feedbackDeliveryDeadline: string;
}
export declare class UpdateReviewCycleRequestDto {
    name?: string;
    selfReviewDeadline?: string;
    peerFeedbackDeadline?: string;
    managerEvalDeadline?: string;
    calibrationDeadline?: string;
    feedbackDeliveryDeadline?: string;
}
export declare class ReviewCycleResponseDto {
    id: string;
    name: string;
    year: number;
    status: ReviewCycleStatusDto;
    selfReviewDeadline: string;
    peerFeedbackDeadline: string;
    managerEvalDeadline: string;
    calibrationDeadline: string;
    feedbackDeliveryDeadline: string;
    createdAt: string;
    updatedAt: string;
}
