import { Injectable, Inject } from '@nestjs/common';
import { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface';
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo';
import { ReviewCycleDto } from '../../dto/review-cycle.dto';

@Injectable()
export class GetReviewCycleUseCase {
  constructor(
    @Inject('IReviewCycleRepository')
    private readonly reviewCycleRepository: IReviewCycleRepository,
  ) {}

  async execute(cycleId: string): Promise<ReviewCycleDto> {
    const cycle = await this.reviewCycleRepository.findById(
      ReviewCycleId.create(cycleId),
    );

    if (!cycle) {
      throw new Error('Review cycle not found');
    }

    return {
      id: cycle.id.value,
      name: cycle.name,
      year: cycle.year,
      status: cycle.status.value,
      deadlines: cycle.deadlines.toObject(),
      startDate: cycle.startDate,
      endDate: cycle.endDate,
    };
  }
}
