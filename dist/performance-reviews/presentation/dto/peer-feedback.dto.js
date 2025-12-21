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
exports.AggregatedPeerFeedbackResponseDto = exports.PeerFeedbackResponseDto = exports.PeerNominationResponseDto = exports.SubmitPeerFeedbackRequestDto = exports.NominatePeersRequestDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class NominatePeersRequestDto {
}
exports.NominatePeersRequestDto = NominatePeersRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002'],
        description: 'Array of peer user IDs (max 5)',
        maxItems: 5
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.ArrayMaxSize)(5),
    __metadata("design:type", Array)
], NominatePeersRequestDto.prototype, "peerIds", void 0);
class SubmitPeerFeedbackRequestDto {
}
exports.SubmitPeerFeedbackRequestDto = SubmitPeerFeedbackRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3, minimum: 0, maximum: 4 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(4),
    __metadata("design:type", Number)
], SubmitPeerFeedbackRequestDto.prototype, "projectImpact", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2, minimum: 0, maximum: 4 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(4),
    __metadata("design:type", Number)
], SubmitPeerFeedbackRequestDto.prototype, "direction", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 4, minimum: 0, maximum: 4 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(4),
    __metadata("design:type", Number)
], SubmitPeerFeedbackRequestDto.prototype, "engineeringExcellence", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3, minimum: 0, maximum: 4 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(4),
    __metadata("design:type", Number)
], SubmitPeerFeedbackRequestDto.prototype, "operationalOwnership", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2, minimum: 0, maximum: 4 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(4),
    __metadata("design:type", Number)
], SubmitPeerFeedbackRequestDto.prototype, "peopleImpact", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Jane consistently delivers high-quality code...',
        maxLength: 2000
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], SubmitPeerFeedbackRequestDto.prototype, "comments", void 0);
class PeerNominationResponseDto {
}
exports.PeerNominationResponseDto = PeerNominationResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '550e8400-e29b-41d4-a716-446655440000' }),
    __metadata("design:type", String)
], PeerNominationResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '550e8400-e29b-41d4-a716-446655440001' }),
    __metadata("design:type", String)
], PeerNominationResponseDto.prototype, "cycleId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '550e8400-e29b-41d4-a716-446655440002' }),
    __metadata("design:type", String)
], PeerNominationResponseDto.prototype, "nomineeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '550e8400-e29b-41d4-a716-446655440003' }),
    __metadata("design:type", String)
], PeerNominationResponseDto.prototype, "peerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'john.doe@example.com' }),
    __metadata("design:type", String)
], PeerNominationResponseDto.prototype, "peerEmail", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'John Doe' }),
    __metadata("design:type", String)
], PeerNominationResponseDto.prototype, "peerName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'PENDING' }),
    __metadata("design:type", String)
], PeerNominationResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-15T10:30:00Z', nullable: true }),
    __metadata("design:type", Object)
], PeerNominationResponseDto.prototype, "submittedAt", void 0);
class PeerFeedbackResponseDto {
}
exports.PeerFeedbackResponseDto = PeerFeedbackResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '550e8400-e29b-41d4-a716-446655440000' }),
    __metadata("design:type", String)
], PeerFeedbackResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '550e8400-e29b-41d4-a716-446655440001' }),
    __metadata("design:type", String)
], PeerFeedbackResponseDto.prototype, "nominationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3 }),
    __metadata("design:type", Number)
], PeerFeedbackResponseDto.prototype, "projectImpact", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2 }),
    __metadata("design:type", Number)
], PeerFeedbackResponseDto.prototype, "direction", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 4 }),
    __metadata("design:type", Number)
], PeerFeedbackResponseDto.prototype, "engineeringExcellence", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3 }),
    __metadata("design:type", Number)
], PeerFeedbackResponseDto.prototype, "operationalOwnership", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2 }),
    __metadata("design:type", Number)
], PeerFeedbackResponseDto.prototype, "peopleImpact", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Jane consistently delivers high-quality code...' }),
    __metadata("design:type", String)
], PeerFeedbackResponseDto.prototype, "comments", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-20T14:30:00Z' }),
    __metadata("design:type", String)
], PeerFeedbackResponseDto.prototype, "submittedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-20T14:30:00Z' }),
    __metadata("design:type", String)
], PeerFeedbackResponseDto.prototype, "createdAt", void 0);
class AggregatedPeerFeedbackResponseDto {
}
exports.AggregatedPeerFeedbackResponseDto = AggregatedPeerFeedbackResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3.2 }),
    __metadata("design:type", Number)
], AggregatedPeerFeedbackResponseDto.prototype, "avgProjectImpact", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2.8 }),
    __metadata("design:type", Number)
], AggregatedPeerFeedbackResponseDto.prototype, "avgDirection", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3.6 }),
    __metadata("design:type", Number)
], AggregatedPeerFeedbackResponseDto.prototype, "avgEngineeringExcellence", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3.0 }),
    __metadata("design:type", Number)
], AggregatedPeerFeedbackResponseDto.prototype, "avgOperationalOwnership", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2.4 }),
    __metadata("design:type", Number)
], AggregatedPeerFeedbackResponseDto.prototype, "avgPeopleImpact", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5 }),
    __metadata("design:type", Number)
], AggregatedPeerFeedbackResponseDto.prototype, "totalResponses", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: [
            'Jane consistently delivers high-quality code...',
            'Strong technical leadership...'
        ]
    }),
    __metadata("design:type", Array)
], AggregatedPeerFeedbackResponseDto.prototype, "anonymousComments", void 0);
//# sourceMappingURL=peer-feedback.dto.js.map