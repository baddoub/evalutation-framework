import { IScoreAdjustmentRequestRepository } from '../../../domain/repositories/score-adjustment-request.repository.interface';
export interface ApproveScoreAdjustmentInput {
    requestId: string;
    reviewedBy: string;
    approved: boolean;
    reviewNotes?: string;
}
export interface ApproveScoreAdjustmentOutput {
    id: string;
    status: string;
    reviewedAt: Date;
    reviewedBy: string;
}
export declare class ApproveScoreAdjustmentUseCase {
    private readonly adjustmentRequestRepository;
    constructor(adjustmentRequestRepository: IScoreAdjustmentRequestRepository);
    execute(input: ApproveScoreAdjustmentInput): Promise<ApproveScoreAdjustmentOutput>;
}
