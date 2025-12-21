import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  UseGuards,
  UseFilters,
  NotFoundException,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard'
import { ReviewAuthorizationGuard } from '../guards/review-authorization.guard'
import { ReviewExceptionFilter } from '../filters/review-exception.filter'
import { CurrentUser, CurrentUserData } from '../decorators/current-user.decorator'
import { Roles } from '../decorators/roles.decorator'
import {
  UpdateManagerEvaluationRequestDto,
  SubmitManagerEvaluationRequestDto,
  ManagerEvaluationResponseDto,
} from '../dto/manager-evaluation.dto'
import { GetManagerEvaluationUseCase } from '../../application/use-cases/manager-evaluations/get-manager-evaluation.use-case'
import { UpdateManagerEvaluationUseCase } from '../../application/use-cases/manager-evaluations/update-manager-evaluation.use-case'
import { SubmitManagerEvaluationUseCase } from '../../application/use-cases/manager-evaluations/submit-manager-evaluation.use-case'
import { ReviewCycleId } from '../../domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../domain/value-objects/user-id.vo'
import { PillarScore } from '../../domain/value-objects/pillar-score.vo'

@ApiTags('Manager Evaluations')
@ApiBearerAuth()
@Controller('performance-reviews/cycles/:cycleId/manager-evaluations')
@UseGuards(JwtAuthGuard, ReviewAuthorizationGuard)
@UseFilters(ReviewExceptionFilter)
export class ManagerEvaluationsController {
  constructor(
    private readonly getManagerEvaluationUseCase: GetManagerEvaluationUseCase,
    private readonly updateManagerEvaluationUseCase: UpdateManagerEvaluationUseCase,
    private readonly submitManagerEvaluationUseCase: SubmitManagerEvaluationUseCase,
  ) {}

  @Get('employees/:employeeId')
  @Roles('MANAGER')
  @ApiOperation({ summary: 'Get manager evaluation for an employee' })
  @ApiResponse({
    status: 200,
    description: 'Manager evaluation retrieved successfully',
    type: ManagerEvaluationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Manager evaluation not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Manager only' })
  async getManagerEvaluation(
    @Param('cycleId') cycleId: string,
    @Param('employeeId') employeeId: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<ManagerEvaluationResponseDto> {
    const result = await this.getManagerEvaluationUseCase.execute({
      cycleId: ReviewCycleId.fromString(cycleId),
      employeeId: UserId.fromString(employeeId),
      managerId: UserId.fromString(user.userId),
    })

    if (!result) {
      throw new NotFoundException('Manager evaluation not found')
    }

    return {
      id: result.id,
      cycleId: result.cycleId,
      employeeId: result.employeeId,
      managerId: result.managerId,
      projectImpact: result.scores.projectImpact,
      direction: result.scores.direction,
      engineeringExcellence: result.scores.engineeringExcellence,
      operationalOwnership: result.scores.operationalOwnership,
      peopleImpact: result.scores.peopleImpact,
      managerComments: result.managerComments,
      status: result.status,
      submittedAt: result.submittedAt ? result.submittedAt.toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  @Patch('employees/:employeeId')
  @Roles('MANAGER')
  @ApiOperation({ summary: 'Update manager evaluation for an employee' })
  @ApiResponse({
    status: 200,
    description: 'Manager evaluation updated successfully',
    type: ManagerEvaluationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Manager evaluation not found' })
  @ApiResponse({ status: 400, description: 'Deadline passed or invalid status' })
  async updateManagerEvaluation(
    @Param('cycleId') cycleId: string,
    @Param('employeeId') employeeId: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UpdateManagerEvaluationRequestDto,
  ): Promise<ManagerEvaluationResponseDto> {
    const scores: any = {}
    if (dto.projectImpact !== undefined) scores.projectImpact = PillarScore.fromValue(dto.projectImpact)
    if (dto.direction !== undefined) scores.direction = PillarScore.fromValue(dto.direction)
    if (dto.engineeringExcellence !== undefined) scores.engineeringExcellence = PillarScore.fromValue(dto.engineeringExcellence)
    if (dto.operationalOwnership !== undefined) scores.operationalOwnership = PillarScore.fromValue(dto.operationalOwnership)
    if (dto.peopleImpact !== undefined) scores.peopleImpact = PillarScore.fromValue(dto.peopleImpact)

    const result = await this.updateManagerEvaluationUseCase.execute({
      cycleId: ReviewCycleId.fromString(cycleId),
      employeeId: UserId.fromString(employeeId),
      managerId: UserId.fromString(user.userId),
      scores: Object.keys(scores).length > 0 ? scores : undefined,
      managerComments: dto.managerComments,
    })

    if (!result) {
      throw new NotFoundException('Manager evaluation not found')
    }

    return {
      id: result.id,
      cycleId: result.cycleId,
      employeeId: result.employeeId,
      managerId: result.managerId,
      projectImpact: result.scores.projectImpact,
      direction: result.scores.direction,
      engineeringExcellence: result.scores.engineeringExcellence,
      operationalOwnership: result.scores.operationalOwnership,
      peopleImpact: result.scores.peopleImpact,
      managerComments: result.managerComments,
      status: result.status,
      submittedAt: result.submittedAt ? result.submittedAt.toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  @Post('employees/:employeeId/submit')
  @Roles('MANAGER')
  @ApiOperation({ summary: 'Submit manager evaluation for an employee' })
  @ApiResponse({
    status: 200,
    description: 'Manager evaluation submitted successfully',
  })
  @ApiResponse({ status: 404, description: 'Manager evaluation not found' })
  @ApiResponse({ status: 400, description: 'Deadline passed' })
  async submitManagerEvaluation(
    @Param('cycleId') cycleId: string,
    @Param('employeeId') employeeId: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: SubmitManagerEvaluationRequestDto,
  ): Promise<{ id: string; status: string; submittedAt: string }> {
    const result = await this.submitManagerEvaluationUseCase.execute({
      cycleId: ReviewCycleId.fromString(cycleId),
      employeeId: UserId.fromString(employeeId),
      managerId: UserId.fromString(user.userId),
      scores: {
        projectImpact: dto.projectImpact,
        direction: dto.direction,
        engineeringExcellence: dto.engineeringExcellence,
        operationalOwnership: dto.operationalOwnership,
        peopleImpact: dto.peopleImpact,
      },
      narrative: dto.narrative,
      strengths: dto.strengths,
      growthAreas: dto.growthAreas,
      developmentPlan: dto.developmentPlan,
    })

    if (!result) {
      throw new NotFoundException('Manager evaluation not found')
    }

    return {
      id: result.id,
      status: result.status,
      submittedAt: result.submittedAt.toISOString(),
    }
  }
}
