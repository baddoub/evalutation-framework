import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseFilters,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard'
import { ReviewAuthorizationGuard } from '../guards/review-authorization.guard'
import { ReviewExceptionFilter } from '../filters/review-exception.filter'
import { RequiresReviewRole } from '../decorators/requires-review-role.decorator'
import { CreateCalibrationSessionDto } from '../dto/requests/create-calibration-session.dto'
import { ApplyCalibrationAdjustmentDto } from '../dto/requests/apply-calibration-adjustment.dto'
import { GetCalibrationDashboardUseCase } from '../../application/use-cases/calibration/get-calibration-dashboard.use-case'
import { CreateCalibrationSessionUseCase } from '../../application/use-cases/calibration/create-calibration-session.use-case'
import { ApplyCalibrationAdjustmentUseCase } from '../../application/use-cases/calibration/apply-calibration-adjustment.use-case'
import { LockFinalScoresUseCase } from '../../application/use-cases/calibration/lock-final-scores.use-case'
import { ReviewCycleId } from '../../domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../domain/value-objects/user-id.vo'

@ApiTags('Calibration')
@ApiBearerAuth()
@Controller('performance-reviews/cycles/:cycleId')
@UseGuards(JwtAuthGuard, ReviewAuthorizationGuard)
@UseFilters(ReviewExceptionFilter)
export class CalibrationController {
  constructor(
    private readonly getCalibrationDashboardUseCase: GetCalibrationDashboardUseCase,
    private readonly createCalibrationSessionUseCase: CreateCalibrationSessionUseCase,
    private readonly applyCalibrationAdjustmentUseCase: ApplyCalibrationAdjustmentUseCase,
    private readonly lockFinalScoresUseCase: LockFinalScoresUseCase,
  ) {}

  @Get('calibration')
  @RequiresReviewRole('CALIBRATOR', 'HR_ADMIN')
  @ApiParam({ name: 'cycleId', description: 'Review cycle ID', example: 'cycle-uuid-123' })
  @ApiQuery({
    name: 'department',
    required: false,
    type: String,
    description: 'Filter by department',
    example: 'Engineering',
  })
  @ApiOperation({
    summary: 'Get calibration dashboard (Calibrator/HR_ADMIN)',
    description:
      'View all evaluations with scores, bonus tiers, and distribution for calibration purposes',
  })
  @ApiResponse({
    status: 200,
    description: 'Calibration dashboard retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Calibrator or HR Admin only' })
  async getCalibrationDashboard(
    @Param('cycleId') cycleId: string,
    @Query('department') department?: string,
  ) {
    const result = await this.getCalibrationDashboardUseCase.execute({
      cycleId: ReviewCycleId.fromString(cycleId),
      department,
    })

    return {
      summary: {
        totalEvaluations: result.summary.totalEvaluations,
        byBonusTier: result.summary.byBonusTier,
        byDepartment: result.summary.byDepartment,
      },
      evaluations: result.evaluations.map((evaluation) => ({
        employeeId: evaluation.employeeId,
        employeeName: evaluation.employeeName,
        level: evaluation.level,
        department: evaluation.department,
        managerId: evaluation.managerId,
        managerName: evaluation.managerName,
        scores: evaluation.scores,
        weightedScore: evaluation.weightedScore,
        percentageScore: evaluation.percentageScore,
        bonusTier: evaluation.bonusTier,
        calibrationStatus: evaluation.calibrationStatus,
      })),
    }
  }

  @Post('calibration/sessions')
  @RequiresReviewRole('CALIBRATOR', 'HR_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiParam({ name: 'cycleId', description: 'Review cycle ID', example: 'cycle-uuid-123' })
  @ApiOperation({
    summary: 'Create calibration session',
    description:
      'Schedule a calibration session with participants to review and normalize performance scores',
  })
  @ApiResponse({
    status: 201,
    description: 'Calibration session created successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Calibrator or HR Admin only' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async createCalibrationSession(
    @Param('cycleId') cycleId: string,
    @Body() dto: CreateCalibrationSessionDto,
  ) {
    const result = await this.createCalibrationSessionUseCase.execute({
      cycleId: ReviewCycleId.fromString(cycleId),
      name: dto.name,
      department: dto.department,
      facilitatorId: UserId.fromString(dto.facilitatorId),
      participantIds: dto.participantIds.map((id) => UserId.fromString(id)),
      scheduledAt: new Date(dto.scheduledAt),
    })

    return {
      id: result.id,
      name: result.name,
      status: result.status,
      scheduledAt: result.scheduledAt.toISOString(),
      participantCount: dto.participantIds.length,
    }
  }

  @Post('calibration/sessions/:sessionId/adjustments')
  @RequiresReviewRole('CALIBRATOR', 'HR_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiParam({ name: 'cycleId', description: 'Review cycle ID', example: 'cycle-uuid-123' })
  @ApiParam({
    name: 'sessionId',
    description: 'Calibration session ID',
    example: 'session-uuid-789',
  })
  @ApiOperation({
    summary: 'Apply calibration adjustment',
    description: "Adjust an employee's scores during calibration session with justification",
  })
  @ApiResponse({
    status: 201,
    description: 'Calibration adjustment applied successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Calibrator or HR Admin only' })
  @ApiResponse({ status: 404, description: 'Session or evaluation not found' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async applyCalibrationAdjustment(
    @Param('sessionId') sessionId: string,
    @Body() dto: ApplyCalibrationAdjustmentDto,
  ) {
    const result = await this.applyCalibrationAdjustmentUseCase.execute({
      sessionId,
      evaluationId: dto.evaluationId,
      adjustedScores: {
        projectImpact: dto.adjustedScores.projectImpact,
        direction: dto.adjustedScores.direction,
        engineeringExcellence: dto.adjustedScores.engineeringExcellence,
        operationalOwnership: dto.adjustedScores.operationalOwnership,
        peopleImpact: dto.adjustedScores.peopleImpact,
      },
      justification: dto.justification,
    })

    return {
      id: result.adjustmentId,
      evaluationId: dto.evaluationId,
      originalScores: result.originalScores,
      adjustedScores: dto.adjustedScores,
      oldWeightedScore: result.oldWeightedScore,
      newWeightedScore: result.newWeightedScore,
      oldBonusTier: result.oldBonusTier,
      newBonusTier: result.newBonusTier,
      adjustedAt: new Date().toISOString(),
    }
  }

  @Post('scores/lock')
  @RequiresReviewRole('HR_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'cycleId', description: 'Review cycle ID', example: 'cycle-uuid-123' })
  @ApiOperation({
    summary: 'Lock final scores (HR_ADMIN only)',
    description: 'Lock all final scores after calibration, preventing further changes',
  })
  @ApiResponse({
    status: 200,
    description: 'Final scores locked successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - HR Admin only' })
  async lockFinalScores(@Param('cycleId') cycleId: string) {
    const result = await this.lockFinalScoresUseCase.execute({
      cycleId: ReviewCycleId.fromString(cycleId),
    })

    return {
      cycleId,
      totalScoresLocked: result.totalScoresLocked,
      lockedAt: result.lockedAt.toISOString(),
    }
  }
}
