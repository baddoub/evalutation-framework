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
exports.ReviewCycleResponseDto = exports.UpdateReviewCycleRequestDto = exports.CreateReviewCycleRequestDto = exports.ReviewCycleStatusDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var ReviewCycleStatusDto;
(function (ReviewCycleStatusDto) {
    ReviewCycleStatusDto["DRAFT"] = "DRAFT";
    ReviewCycleStatusDto["ACTIVE"] = "ACTIVE";
    ReviewCycleStatusDto["CALIBRATING"] = "CALIBRATING";
    ReviewCycleStatusDto["COMPLETED"] = "COMPLETED";
    ReviewCycleStatusDto["CLOSED"] = "CLOSED";
})(ReviewCycleStatusDto || (exports.ReviewCycleStatusDto = ReviewCycleStatusDto = {}));
class CreateReviewCycleRequestDto {
}
exports.CreateReviewCycleRequestDto = CreateReviewCycleRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024 Annual Review' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateReviewCycleRequestDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2024, minimum: 2020, maximum: 2100 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(2020),
    (0, class_validator_1.Max)(2100),
    __metadata("design:type", Number)
], CreateReviewCycleRequestDto.prototype, "year", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-15T00:00:00Z' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateReviewCycleRequestDto.prototype, "selfReviewDeadline", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-02-01T00:00:00Z' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateReviewCycleRequestDto.prototype, "peerFeedbackDeadline", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-02-15T00:00:00Z' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateReviewCycleRequestDto.prototype, "managerEvalDeadline", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-03-01T00:00:00Z' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateReviewCycleRequestDto.prototype, "calibrationDeadline", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-03-15T00:00:00Z' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateReviewCycleRequestDto.prototype, "feedbackDeliveryDeadline", void 0);
class UpdateReviewCycleRequestDto {
}
exports.UpdateReviewCycleRequestDto = UpdateReviewCycleRequestDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024 Annual Review - Updated' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateReviewCycleRequestDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-01-20T00:00:00Z' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateReviewCycleRequestDto.prototype, "selfReviewDeadline", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-02-05T00:00:00Z' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateReviewCycleRequestDto.prototype, "peerFeedbackDeadline", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-02-20T00:00:00Z' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateReviewCycleRequestDto.prototype, "managerEvalDeadline", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-03-05T00:00:00Z' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateReviewCycleRequestDto.prototype, "calibrationDeadline", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2024-03-20T00:00:00Z' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateReviewCycleRequestDto.prototype, "feedbackDeliveryDeadline", void 0);
class ReviewCycleResponseDto {
}
exports.ReviewCycleResponseDto = ReviewCycleResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '550e8400-e29b-41d4-a716-446655440000' }),
    __metadata("design:type", String)
], ReviewCycleResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024 Annual Review' }),
    __metadata("design:type", String)
], ReviewCycleResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2024 }),
    __metadata("design:type", Number)
], ReviewCycleResponseDto.prototype, "year", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ReviewCycleStatusDto, example: ReviewCycleStatusDto.ACTIVE }),
    __metadata("design:type", String)
], ReviewCycleResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-15T00:00:00Z' }),
    __metadata("design:type", String)
], ReviewCycleResponseDto.prototype, "selfReviewDeadline", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-02-01T00:00:00Z' }),
    __metadata("design:type", String)
], ReviewCycleResponseDto.prototype, "peerFeedbackDeadline", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-02-15T00:00:00Z' }),
    __metadata("design:type", String)
], ReviewCycleResponseDto.prototype, "managerEvalDeadline", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-03-01T00:00:00Z' }),
    __metadata("design:type", String)
], ReviewCycleResponseDto.prototype, "calibrationDeadline", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-03-15T00:00:00Z' }),
    __metadata("design:type", String)
], ReviewCycleResponseDto.prototype, "feedbackDeliveryDeadline", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-01T00:00:00Z' }),
    __metadata("design:type", String)
], ReviewCycleResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-02T00:00:00Z' }),
    __metadata("design:type", String)
], ReviewCycleResponseDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=review-cycle.dto.js.map