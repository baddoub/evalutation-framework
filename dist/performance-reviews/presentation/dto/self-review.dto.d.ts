export declare class UpdateSelfReviewRequestDto {
    projectImpact?: number;
    direction?: number;
    engineeringExcellence?: number;
    operationalOwnership?: number;
    peopleImpact?: number;
    narrative?: string;
}
export declare class SelfReviewResponseDto {
    id: string;
    cycleId: string;
    userId: string;
    projectImpact: number;
    direction: number;
    engineeringExcellence: number;
    operationalOwnership: number;
    peopleImpact: number;
    narrative: string;
    status: string;
    submittedAt: string | null;
    createdAt: string;
    updatedAt: string;
}
