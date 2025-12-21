import { UserId } from '../../../auth/domain/value-objects/user-id.vo';
import { ReviewCycleId } from '../../domain/value-objects/review-cycle-id.vo';
export interface ManagerEvaluationDto {
    id: string;
    cycleId: string;
    employeeId: string;
    managerId: string;
    scores: {
        projectImpact: number;
        direction: number;
        engineeringExcellence: number;
        operationalOwnership: number;
        peopleImpact: number;
    };
    narrative: string;
    strengths: string;
    growthAreas: string;
    developmentPlan: string;
    status: string;
    submittedAt?: Date;
    calibratedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface GetTeamReviewsInput {
    managerId: UserId;
    cycleId: ReviewCycleId;
}
export interface GetTeamReviewsOutput {
    reviews: Array<{
        employeeId: string;
        employeeName: string;
        employeeLevel: string;
        selfReviewStatus: string;
        peerFeedbackCount: number;
        peerFeedbackStatus: string;
        managerEvalStatus: string;
        hasSubmittedEvaluation: boolean;
    }>;
    total: number;
}
export interface GetEmployeeReviewInput {
    employeeId: UserId;
    cycleId: ReviewCycleId;
    managerId: UserId;
}
export interface GetEmployeeReviewOutput {
    employee: {
        id: string;
        name: string;
        email: string;
        level: string;
        department: string;
    };
    selfReview: {
        scores: {
            projectImpact: number;
            direction: number;
            engineeringExcellence: number;
            operationalOwnership: number;
            peopleImpact: number;
        };
        narrative: string;
        submittedAt?: Date;
    };
    peerFeedback: {
        count: number;
        aggregatedScores: {
            projectImpact: number;
            direction: number;
            engineeringExcellence: number;
            operationalOwnership: number;
            peopleImpact: number;
        };
        attributedFeedback: Array<{
            reviewerId: string;
            reviewerName: string;
            scores: {
                projectImpact: number;
                direction: number;
                engineeringExcellence: number;
                operationalOwnership: number;
                peopleImpact: number;
            };
            strengths?: string;
            growthAreas?: string;
            generalComments?: string;
        }>;
    };
    managerEvaluation?: {
        id: string;
        status: string;
        scores?: {
            projectImpact: number;
            direction: number;
            engineeringExcellence: number;
            operationalOwnership: number;
            peopleImpact: number;
        };
        narrative?: string;
        strengths?: string;
        growthAreas?: string;
        developmentPlan?: string;
    };
}
export interface SubmitManagerEvaluationInput {
    employeeId: UserId;
    managerId: UserId;
    cycleId: ReviewCycleId;
    scores: {
        projectImpact: number;
        direction: number;
        engineeringExcellence: number;
        operationalOwnership: number;
        peopleImpact: number;
    };
    narrative: string;
    strengths: string;
    growthAreas: string;
    developmentPlan: string;
}
export interface SubmitManagerEvaluationOutput {
    id: string;
    employeeId: string;
    status: string;
    scores: {
        projectImpact: number;
        direction: number;
        engineeringExcellence: number;
        operationalOwnership: number;
        peopleImpact: number;
    };
    submittedAt: Date;
}
