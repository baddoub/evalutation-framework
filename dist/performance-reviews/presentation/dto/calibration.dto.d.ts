export declare enum CalibrationStatusDto {
    DRAFT = "DRAFT",
    IN_CALIBRATION = "IN_CALIBRATION",
    CALIBRATED = "CALIBRATED",
    LOCKED = "LOCKED"
}
export declare class RecordCalibrationNoteRequestDto {
    notes: string;
}
export declare class ApplyCalibrationAdjustmentRequestDto {
    projectImpact: number;
    direction: number;
    engineeringExcellence: number;
    operationalOwnership: number;
    peopleImpact: number;
    reason: string;
}
export declare class CalibrationSessionResponseDto {
    id: string;
    cycleId: string;
    department: string;
    status: CalibrationStatusDto;
    notes: string;
    lockedAt: string | null;
    lockedBy: string | null;
    createdAt: string;
    updatedAt: string;
}
export declare class CalibrationAdjustmentResponseDto {
    id: string;
    sessionId: string;
    managerEvaluationId: string;
    previousProjectImpact: number;
    adjustedProjectImpact: number;
    previousDirection: number;
    adjustedDirection: number;
    reason: string;
    adjustedBy: string;
    createdAt: string;
}
