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
exports.ManagerEvaluationResponseDto = exports.SubmitManagerEvaluationRequestDto = exports.UpdateManagerEvaluationRequestDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class UpdateManagerEvaluationRequestDto {
}
exports.UpdateManagerEvaluationRequestDto = UpdateManagerEvaluationRequestDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 3, minimum: 0, maximum: 4 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(4),
    __metadata("design:type", Number)
], UpdateManagerEvaluationRequestDto.prototype, "projectImpact", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 3, minimum: 0, maximum: 4 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(4),
    __metadata("design:type", Number)
], UpdateManagerEvaluationRequestDto.prototype, "direction", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 4, minimum: 0, maximum: 4 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(4),
    __metadata("design:type", Number)
], UpdateManagerEvaluationRequestDto.prototype, "engineeringExcellence", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 3, minimum: 0, maximum: 4 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(4),
    __metadata("design:type", Number)
], UpdateManagerEvaluationRequestDto.prototype, "operationalOwnership", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 3, minimum: 0, maximum: 4 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(4),
    __metadata("design:type", Number)
], UpdateManagerEvaluationRequestDto.prototype, "peopleImpact", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'John has shown exceptional growth this year...',
        maxLength: 3000
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(3000),
    __metadata("design:type", String)
], UpdateManagerEvaluationRequestDto.prototype, "managerComments", void 0);
class SubmitManagerEvaluationRequestDto {
}
exports.SubmitManagerEvaluationRequestDto = SubmitManagerEvaluationRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3, minimum: 0, maximum: 4 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(4),
    __metadata("design:type", Number)
], SubmitManagerEvaluationRequestDto.prototype, "projectImpact", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3, minimum: 0, maximum: 4 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(4),
    __metadata("design:type", Number)
], SubmitManagerEvaluationRequestDto.prototype, "direction", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 4, minimum: 0, maximum: 4 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(4),
    __metadata("design:type", Number)
], SubmitManagerEvaluationRequestDto.prototype, "engineeringExcellence", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3, minimum: 0, maximum: 4 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(4),
    __metadata("design:type", Number)
], SubmitManagerEvaluationRequestDto.prototype, "operationalOwnership", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3, minimum: 0, maximum: 4 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(4),
    __metadata("design:type", Number)
], SubmitManagerEvaluationRequestDto.prototype, "peopleImpact", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'John has consistently delivered high-impact projects...',
        maxLength: 3000
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(3000),
    __metadata("design:type", String)
], SubmitManagerEvaluationRequestDto.prototype, "narrative", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Strong technical leadership and mentoring skills...',
        maxLength: 2000
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], SubmitManagerEvaluationRequestDto.prototype, "strengths", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Could improve time management and prioritization...',
        maxLength: 2000
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], SubmitManagerEvaluationRequestDto.prototype, "growthAreas", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Focus on delegation and team empowerment in Q2...',
        maxLength: 2000
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], SubmitManagerEvaluationRequestDto.prototype, "developmentPlan", void 0);
class ManagerEvaluationResponseDto {
}
exports.ManagerEvaluationResponseDto = ManagerEvaluationResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '550e8400-e29b-41d4-a716-446655440000' }),
    __metadata("design:type", String)
], ManagerEvaluationResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '550e8400-e29b-41d4-a716-446655440001' }),
    __metadata("design:type", String)
], ManagerEvaluationResponseDto.prototype, "cycleId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '550e8400-e29b-41d4-a716-446655440002' }),
    __metadata("design:type", String)
], ManagerEvaluationResponseDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '550e8400-e29b-41d4-a716-446655440003' }),
    __metadata("design:type", String)
], ManagerEvaluationResponseDto.prototype, "managerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3 }),
    __metadata("design:type", Number)
], ManagerEvaluationResponseDto.prototype, "projectImpact", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3 }),
    __metadata("design:type", Number)
], ManagerEvaluationResponseDto.prototype, "direction", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 4 }),
    __metadata("design:type", Number)
], ManagerEvaluationResponseDto.prototype, "engineeringExcellence", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3 }),
    __metadata("design:type", Number)
], ManagerEvaluationResponseDto.prototype, "operationalOwnership", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3 }),
    __metadata("design:type", Number)
], ManagerEvaluationResponseDto.prototype, "peopleImpact", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'John has shown exceptional growth...' }),
    __metadata("design:type", String)
], ManagerEvaluationResponseDto.prototype, "managerComments", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'DRAFT' }),
    __metadata("design:type", String)
], ManagerEvaluationResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-02-15T10:30:00Z', nullable: true }),
    __metadata("design:type", Object)
], ManagerEvaluationResponseDto.prototype, "submittedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-02-01T00:00:00Z' }),
    __metadata("design:type", String)
], ManagerEvaluationResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-02-10T00:00:00Z' }),
    __metadata("design:type", String)
], ManagerEvaluationResponseDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=manager-evaluation.dto.js.map