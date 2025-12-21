export declare class UpdateManagerEvaluationRequestDto {
    projectImpact?: number;
    direction?: number;
    engineeringExcellence?: number;
    operationalOwnership?: number;
    peopleImpact?: number;
    managerComments?: string;
}
export declare class SubmitManagerEvaluationRequestDto {
    projectImpact: number;
    direction: number;
    engineeringExcellence: number;
    operationalOwnership: number;
    peopleImpact: number;
    narrative: string;
    strengths: string;
    growthAreas: string;
    developmentPlan: string;
}
export declare class ManagerEvaluationResponseDto {
    id: string;
    cycleId: string;
    employeeId: string;
    managerId: string;
    projectImpact: number;
    direction: number;
    engineeringExcellence: number;
    operationalOwnership: number;
    peopleImpact: number;
    managerComments?: string;
    status: string;
    submittedAt: string | null;
    createdAt: string;
    updatedAt: string;
}
