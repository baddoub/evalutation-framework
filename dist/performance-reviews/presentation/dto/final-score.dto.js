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
exports.ScoreAdjustmentResponseDto = exports.ScoreAdjustmentRequestDto = exports.FinalScoreResponseDto = exports.DeliverFeedbackRequestDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class DeliverFeedbackRequestDto {
}
exports.DeliverFeedbackRequestDto = DeliverFeedbackRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Great work this year! Focus areas for next year include...',
        maxLength: 5000
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(5000),
    __metadata("design:type", String)
], DeliverFeedbackRequestDto.prototype, "feedbackNotes", void 0);
class FinalScoreResponseDto {
}
exports.FinalScoreResponseDto = FinalScoreResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '550e8400-e29b-41d4-a716-446655440000' }),
    __metadata("design:type", String)
], FinalScoreResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '550e8400-e29b-41d4-a716-446655440001' }),
    __metadata("design:type", String)
], FinalScoreResponseDto.prototype, "cycleId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '550e8400-e29b-41d4-a716-446655440002' }),
    __metadata("design:type", String)
], FinalScoreResponseDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3.2 }),
    __metadata("design:type", Number)
], FinalScoreResponseDto.prototype, "weightedScore", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 80.0 }),
    __metadata("design:type", Number)
], FinalScoreResponseDto.prototype, "percentageScore", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'MEETS_EXPECTATIONS' }),
    __metadata("design:type", String)
], FinalScoreResponseDto.prototype, "bonusTier", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Great work this year!...', nullable: true }),
    __metadata("design:type", String)
], FinalScoreResponseDto.prototype, "feedbackNotes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-03-15T10:00:00Z', nullable: true }),
    __metadata("design:type", Object)
], FinalScoreResponseDto.prototype, "deliveredAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '550e8400-e29b-41d4-a716-446655440003', nullable: true }),
    __metadata("design:type", Object)
], FinalScoreResponseDto.prototype, "deliveredBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-03-10T00:00:00Z' }),
    __metadata("design:type", String)
], FinalScoreResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-03-15T10:00:00Z' }),
    __metadata("design:type", String)
], FinalScoreResponseDto.prototype, "updatedAt", void 0);
class ScoreAdjustmentRequestDto {
}
exports.ScoreAdjustmentRequestDto = ScoreAdjustmentRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3.5 }),
    __metadata("design:type", Number)
], ScoreAdjustmentRequestDto.prototype, "newWeightedScore", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Score adjustment requested due to additional project completion',
        maxLength: 1000
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], ScoreAdjustmentRequestDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: {
            projectImpact: 3,
            direction: 3,
            engineeringExcellence: 4,
            operationalOwnership: 3,
            peopleImpact: 3
        }
    }),
    __metadata("design:type", Object)
], ScoreAdjustmentRequestDto.prototype, "proposedScores", void 0);
class ScoreAdjustmentResponseDto {
}
exports.ScoreAdjustmentResponseDto = ScoreAdjustmentResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '550e8400-e29b-41d4-a716-446655440000' }),
    __metadata("design:type", String)
], ScoreAdjustmentResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '550e8400-e29b-41d4-a716-446655440001' }),
    __metadata("design:type", String)
], ScoreAdjustmentResponseDto.prototype, "finalScoreId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3.2 }),
    __metadata("design:type", Number)
], ScoreAdjustmentResponseDto.prototype, "previousScore", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3.5 }),
    __metadata("design:type", Number)
], ScoreAdjustmentResponseDto.prototype, "requestedScore", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Score adjustment requested due to...' }),
    __metadata("design:type", String)
], ScoreAdjustmentResponseDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'PENDING' }),
    __metadata("design:type", String)
], ScoreAdjustmentResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '550e8400-e29b-41d4-a716-446655440002' }),
    __metadata("design:type", String)
], ScoreAdjustmentResponseDto.prototype, "requestedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-03-21T14:00:00Z', nullable: true }),
    __metadata("design:type", Object)
], ScoreAdjustmentResponseDto.prototype, "reviewedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Approved after review', nullable: true }),
    __metadata("design:type", Object)
], ScoreAdjustmentResponseDto.prototype, "reviewNotes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-03-20T10:00:00Z' }),
    __metadata("design:type", String)
], ScoreAdjustmentResponseDto.prototype, "requestedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '550e8400-e29b-41d4-a716-446655440003', nullable: true }),
    __metadata("design:type", Object)
], ScoreAdjustmentResponseDto.prototype, "reviewedBy", void 0);
//# sourceMappingURL=final-score.dto.js.map