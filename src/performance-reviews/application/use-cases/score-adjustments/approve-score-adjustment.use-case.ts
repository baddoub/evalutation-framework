import { Injectable, Inject } from '@nestjs/common';
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

@Injectable()
export class ApproveScoreAdjustmentUseCase {
  constructor(
    @Inject('IScoreAdjustmentRequestRepository')
    private readonly adjustmentRequestRepository: IScoreAdjustmentRequestRepository,
  ) {}

  async execute(input: ApproveScoreAdjustmentInput): Promise<ApproveScoreAdjustmentOutput> {
    const request = await this.adjustmentRequestRepository.findById(
      input.requestId,
    );

    if (!request) {
      throw new Error('Score adjustment request not found');
    }

    if (input.approved) {
      request.approve(input.reviewedBy, input.reviewNotes);
    } else {
      request.reject(input.reviewedBy, input.reviewNotes);
    }

    const savedRequest = await this.adjustmentRequestRepository.save(request);

    return {
      id: savedRequest.id,
      status: savedRequest.status,
      reviewedAt: savedRequest.reviewedAt!,
      reviewedBy: savedRequest.approverId!.value,
    };
  }
}
