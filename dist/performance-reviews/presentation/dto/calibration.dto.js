"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalibrationAdjustmentResponseDto = exports.CalibrationSessionResponseDto = exports.ApplyCalibrationAdjustmentRequestDto = exports.RecordCalibrationNoteRequestDto = exports.CalibrationStatusDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var CalibrationStatusDto;
(function (CalibrationStatusDto) {
    CalibrationStatusDto["DRAFT"] = "DRAFT";
    CalibrationStatusDto["IN_CALIBRATION"] = "IN_CALIBRATION";
    CalibrationStatusDto["CALIBRATED"] = "CALIBRATED";
    CalibrationStatusDto["LOCKED"] = "LOCKED";
})(CalibrationStatusDto || (exports.CalibrationStatusDto = CalibrationStatusDto = {}));
class RecordCalibrationNoteRequestDto {
}
exports.RecordCalibrationNoteRequestDto = RecordCalibrationNoteRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Discussed with Jane Smith and Bob Johnson. Agreed to adjust scores...',
        maxLength: 2000
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], RecordCalibrationNoteRequestDto.prototype, "notes", void 0);
class ApplyCalibrationAdjustmentRequestDto {
}
exports.ApplyCalibrationAdjustmentRequestDto = ApplyCalibrationAdjustmentRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3, minimum: 0, maximum: 4 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(4),
    __metadata("design:type", Number)
], ApplyCalibrationAdjustmentRequestDto.prototype, "projectImpact", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3, minimum: 0, maximum: 4 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(4),
    __metadata("design:type", Number)
], ApplyCalibrationAdjustmentRequestDto.prototype, "direction", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 4, minimum: 0, maximum: 4 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(4),
    __metadata("design:type", Number)
], ApplyCalibrationAdjustmentRequestDto.prototype, "engineeringExcellence", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3, minimum: 0, maximum: 4 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(4),
    __metadata("design:type", Number)
], ApplyCalibrationAdjustmentRequestDto.prototype, "operationalOwnership", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3, minimum: 0, maximum: 4 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(4),
    __metadata("design:type", Number)
], ApplyCalibrationAdjustmentRequestDto.prototype, "peopleImpact", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Adjusted after calibration meeting on 2024-03-01',
        maxLength: 1000
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], ApplyCalibrationAdjustmentRequestDto.prototype, "reason", void 0);
class CalibrationSessionResponseDto {
}
exports.CalibrationSessionResponseDto = CalibrationSessionResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '550e8400-e29b-41d4-a716-446655440000' }),
    __metadata("design:type", String)
], CalibrationSessionResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '550e8400-e29b-41d4-a716-446655440001' }),
    __metadata("design:type", String)
], CalibrationSessionResponseDto.prototype, "cycleId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Engineering Department' }),
    __metadata("design:type", String)
], CalibrationSessionResponseDto.prototype, "department", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: CalibrationStatusDto, example: CalibrationStatusDto.IN_CALIBRATION }),
    __metadata("design:type", String)
], CalibrationSessionResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Discussed initial scores with all managers...' }),
    __metadata("design:type", String)
], CalibrationSessionResponseDto.prototype, "notes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-03-01T10:00:00Z', nullable: true }),
    __metadata("design:type", Object)
], CalibrationSessionResponseDto.prototype, "lockedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '550e8400-e29b-41d4-a716-446655440003', nullable: true }),
    __metadata("design:type", Object)
], CalibrationSessionResponseDto.prototype, "lockedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-02-25T00:00:00Z' }),
    __metadata("design:type", String)
], CalibrationSessionResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-03-01T10:00:00Z' }),
    __metadata("design:type", String)
], CalibrationSessionResponseDto.prototype, "updatedAt", void 0);
class CalibrationAdjustmentResponseDto {
}
exports.CalibrationAdjustmentResponseDto = CalibrationAdjustmentResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '550e8400-e29b-41d4-a716-446655440000' }),
    __metadata("design:type", String)
], CalibrationAdjustmentResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '550e8400-e29b-41d4-a716-446655440001' }),
    __metadata("design:type", String)
], CalibrationAdjustmentResponseDto.prototype, "sessionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '550e8400-e29b-41d4-a716-446655440002' }),
    __metadata("design:type", String)
], CalibrationAdjustmentResponseDto.prototype, "managerEvaluationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3 }),
    __metadata("design:type", Number)
], CalibrationAdjustmentResponseDto.prototype, "previousProjectImpact", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3 }),
    __metadata("design:type", Number)
], CalibrationAdjustmentResponseDto.prototype, "adjustedProjectImpact", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2 }),
    __metadata("design:type", Number)
], CalibrationAdjustmentResponseDto.prototype, "previousDirection", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3 }),
    __metadata("design:type", Number)
], CalibrationAdjustmentResponseDto.prototype, "adjustedDirection", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Adjusted after calibration meeting' }),
    __metadata("design:type", String)
], CalibrationAdjustmentResponseDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '550e8400-e29b-41d4-a716-446655440003' }),
    __metadata("design:type", String)
], CalibrationAdjustmentResponseDto.prototype, "adjustedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-03-01T14:30:00Z' }),
    __metadata("design:type", String)
], CalibrationAdjustmentResponseDto.prototype, "createdAt", void 0);
//# sourceMappingURL=calibration.dto.js.map