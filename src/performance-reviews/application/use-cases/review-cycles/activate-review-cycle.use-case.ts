import { Injectable, Inject } from '@nestjs/common';
import { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface';
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo';

export interface ActivateReviewCycleOutput {
  id: string;
  name: string;
  status: string;
  activatedAt: Date;
}

@Injectable()
export class ActivateReviewCycleUseCase {
  constructor(
    @Inject('IReviewCycleRepository')
    private readonly reviewCycleRepository: IReviewCycleRepository,
  ) {}

  async execute(cycleId: string): Promise<ActivateReviewCycleOutput> {
    const cycle = await this.reviewCycleRepository.findById(
      ReviewCycleId.create(cycleId),
    );

    if (!cycle) {
      throw new Error('Review cycle not found');
    }

    cycle.activate();
    const savedCycle = await this.reviewCycleRepository.save(cycle);

    return {
      id: savedCycle.id.value,
      name: savedCycle.name,
      status: savedCycle.status.value,
      activatedAt: savedCycle.startDate,
    };
  }
}
