import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  UseFilters,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard'
import { ReviewAuthorizationGuard } from '../guards/review-authorization.guard'
import { ReviewExceptionFilter } from '../filters/review-exception.filter'
import { CurrentUser, CurrentUserData } from '../decorators/current-user.decorator'
import { Roles } from '../decorators/roles.decorator'
import {
  RecordCalibrationNoteRequestDto,
  ApplyCalibrationAdjustmentRequestDto,
  CalibrationSessionResponseDto,
} from '../dto/calibration.dto'
import { GetCalibrationSessionUseCase } from '../../application/use-cases/calibration/get-calibration-session.use-case'
import { RecordCalibrationNoteUseCase } from '../../application/use-cases/calibration/record-calibration-note.use-case'
import { ApplyCalibrationAdjustmentUseCase } from '../../application/use-cases/calibration/apply-calibration-adjustment.use-case'
import { LockCalibrationUseCase } from '../../application/use-cases/calibration/lock-calibration.use-case'
import { CalibrationSessionId } from '../../domain/value-objects/calibration-session-id.vo'
import { UserId } from '../../domain/value-objects/user-id.vo'

@ApiTags('Calibration')
@ApiBearerAuth()
@Controller('performance-reviews/cycles/:cycleId/calibration')
@UseGuards(JwtAuthGuard, ReviewAuthorizationGuard)
@UseFilters(ReviewExceptionFilter)
export class CalibrationController {
  constructor(
    private readonly getCalibrationSessionUseCase: GetCalibrationSessionUseCase,
    private readonly recordCalibrationNoteUseCase: RecordCalibrationNoteUseCase,
    private readonly applyCalibrationAdjustmentUseCase: ApplyCalibrationAdjustmentUseCase,
    private readonly lockCalibrationUseCase: LockCalibrationUseCase,
  ) {}

  @Get('sessions/:sessionId')
  @Roles('MANAGER', 'HR_ADMIN')
  @ApiOperation({ summary: 'Get calibration session' })
  @ApiResponse({
    status: 200,
    description: 'Calibration session retrieved successfully',
    type: CalibrationSessionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Calibration session not found' })
  async getCalibrationSession(
    @Param('sessionId') sessionId: string,
  ): Promise<CalibrationSessionResponseDto> {
    const result = await this.getCalibrationSessionUseCase.execute(
      CalibrationSessionId.fromString(sessionId),
    )

    if (!result) {
      throw new Error('Calibration session not found')
    }

    return {
      id: result.id,
      cycleId: result.cycleId,
      department: result.department,
      status: result.status as any,
      notes: result.notes,
      lockedAt: result.lockedAt ? result.lockedAt.toISOString() : null,
      lockedBy: result.lockedBy || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  @Post('sessions/:sessionId/notes')
  @Roles('MANAGER', 'HR_ADMIN')
  @ApiOperation({ summary: 'Record calibration notes' })
  @ApiResponse({
    status: 200,
    description: 'Calibration notes recorded successfully',
    type: CalibrationSessionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Calibration session not found' })
  async recordCalibrationNote(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: RecordCalibrationNoteRequestDto,
  ): Promise<CalibrationSessionResponseDto> {
    const result = await this.recordCalibrationNoteUseCase.execute({
      sessionId: CalibrationSessionId.fromString(sessionId),
      notes: dto.notes,
      recordedBy: UserId.fromString(user.userId),
    })

    if (!result) {
      throw new Error('Calibration session not found')
    }

    return {
      id: result.id,
      cycleId: result.cycleId,
      department: result.department,
      status: result.status as any,
      notes: result.notes,
      lockedAt: result.lockedAt ? result.lockedAt.toISOString() : null,
      lockedBy: result.lockedBy || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  @Post('sessions/:sessionId/adjustments/:evaluationId')
  @Roles('MANAGER', 'HR_ADMIN')
  @ApiOperation({ summary: 'Apply calibration adjustment to manager evaluation' })
  @ApiResponse({
    status: 200,
    description: 'Calibration adjustment applied successfully',
  })
  @ApiResponse({ status: 404, description: 'Session or evaluation not found' })
  @ApiResponse({ status: 400, description: 'Session is locked' })
  async applyCalibrationAdjustment(
    @Param('sessionId') sessionId: string,
    @Param('evaluationId') evaluationId: string,
    @Body() dto: ApplyCalibrationAdjustmentRequestDto,
  ): Promise<{ id: string; message: string }> {
    const result = await this.applyCalibrationAdjustmentUseCase.execute({
      sessionId,
      evaluationId,
      adjustedScores: {
        projectImpact: dto.projectImpact,
        direction: dto.direction,
        engineeringExcellence: dto.engineeringExcellence,
        operationalOwnership: dto.operationalOwnership,
        peopleImpact: dto.peopleImpact,
      },
      justification: dto.reason,
    })

    return {
      id: result.adjustmentId,
      message: 'Calibration adjustment applied successfully',
    }
  }

  @Post('sessions/:sessionId/lock')
  @Roles('HR_ADMIN')
  @ApiOperation({ summary: 'Lock calibration session' })
  @ApiResponse({
    status: 200,
    description: 'Calibration session locked successfully',
    type: CalibrationSessionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Calibration session not found' })
  @ApiResponse({ status: 400, description: 'Session already locked' })
  async lockCalibration(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<CalibrationSessionResponseDto> {
    const result = await this.lockCalibrationUseCase.execute({
      sessionId: CalibrationSessionId.fromString(sessionId),
      lockedBy: UserId.fromString(user.userId),
    })

    if (!result) {
      throw new Error('Calibration session not found')
    }

    return {
      id: result.id,
      cycleId: result.cycleId,
      department: result.department,
      status: result.status as any,
      notes: result.notes,
      lockedAt: result.lockedAt ? result.lockedAt.toISOString() : null,
      lockedBy: result.lockedBy || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }
}
