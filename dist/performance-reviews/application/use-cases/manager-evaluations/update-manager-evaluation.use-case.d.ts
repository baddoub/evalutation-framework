import { IManagerEvaluationRepository } from '../../../domain/repositories/manager-evaluation.repository.interface';
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo';
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo';
export interface UpdateManagerEvaluationInput {
    evaluationId?: string;
    cycleId?: ReviewCycleId;
    employeeId?: UserId;
    managerId?: UserId;
    scores?: {
        projectImpact: number;
        direction: number;
        engineeringExcellence: number;
        operationalOwnership: number;
        peopleImpact: number;
    };
    performanceNarrative?: string;
    growthAreas?: string;
    proposedLevel?: string;
    managerComments?: string;
}
export interface UpdateManagerEvaluationOutput {
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
    managerComments?: string;
    status: string;
    submittedAt?: Date;
    updatedAt: Date;
}
export declare class UpdateManagerEvaluationUseCase {
    private readonly managerEvaluationRepository;
    constructor(managerEvaluationRepository: IManagerEvaluationRepository);
    execute(input: UpdateManagerEvaluationInput): Promise<UpdateManagerEvaluationOutput>;
}
