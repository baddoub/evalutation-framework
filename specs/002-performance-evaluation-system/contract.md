# API Contract: Performance Evaluation System

**Feature ID**: 002
**Date**: 2025-12-12
**Base URL**: `/api/v1/performance-reviews`
**Authentication**: JWT Bearer Token (required for all endpoints except health)

---

## Authentication & Authorization

All endpoints require valid JWT token from Keycloak OAuth flow (Feature 001).

**Role-Based Access**:
- `USER` (Engineer): Can view own reviews, submit self-review, nominate peers, provide peer feedback
- `MANAGER`: Can view team reviews, submit evaluations, participate in calibration
- `CALIBRATOR`: Can view cross-team reviews, adjust scores during calibration
- `HR_ADMIN`: Full access to all reviews, cycles, and admin functions

---

## 1. Review Cycles

### List Review Cycles

```
GET /api/v1/performance-reviews/cycles
```

**Authorization**: Any authenticated user

**Query Parameters**:
- `year?: number` - Filter by year
- `status?: CycleStatus` - Filter by status (DRAFT, ACTIVE, CALIBRATION, COMPLETED)
- `limit?: number` - Pagination limit (default: 20)
- `offset?: number` - Pagination offset (default: 0)

**Response** (200 OK):
```json
{
  "cycles": [
    {
      "id": "cycle-uuid",
      "name": "2025 Annual Review",
      "year": 2025,
      "status": "ACTIVE",
      "deadlines": {
        "selfReview": "2025-02-15T23:59:59Z",
        "peerFeedback": "2025-03-01T23:59:59Z",
        "managerEval": "2025-03-15T23:59:59Z",
        "calibration": "2025-03-30T23:59:59Z",
        "feedbackDelivery": "2025-04-15T23:59:59Z"
      },
      "startDate": "2025-02-01T00:00:00Z",
      "endDate": null
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

---

### Get Active Review Cycle

```
GET /api/v1/performance-reviews/cycles/active
```

**Authorization**: Any authenticated user

**Response** (200 OK):
```json
{
  "id": "cycle-uuid",
  "name": "2025 Annual Review",
  "year": 2025,
  "status": "ACTIVE",
  "currentPhase": "SELF_REVIEW",
  "deadlines": { ... },
  "startDate": "2025-02-01T00:00:00Z"
}
```

**Response** (404 Not Found):
```json
{
  "statusCode": 404,
  "message": "No active review cycle",
  "timestamp": "2025-02-01T10:30:00Z"
}
```

---

### Create Review Cycle (Admin Only)

```
POST /api/v1/performance-reviews/cycles
```

**Authorization**: `HR_ADMIN` role required

**Request Body**:
```json
{
  "name": "2025 Annual Review",
  "year": 2025,
  "deadlines": {
    "selfReview": "2025-02-15T23:59:59Z",
    "peerFeedback": "2025-03-01T23:59:59Z",
    "managerEval": "2025-03-15T23:59:59Z",
    "calibration": "2025-03-30T23:59:59Z",
    "feedbackDelivery": "2025-04-15T23:59:59Z"
  },
  "startDate": "2025-02-01T00:00:00Z"
}
```

**Validation**:
- Name required (max 100 chars)
- Year must be current or future year
- All deadlines required and must be in chronological order
- Start date required

**Response** (201 Created):
```json
{
  "id": "cycle-uuid",
  "name": "2025 Annual Review",
  "year": 2025,
  "status": "DRAFT",
  "deadlines": { ... },
  "createdAt": "2025-01-15T10:00:00Z"
}
```

**Error** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": "Deadlines must be in chronological order",
  "errors": ["peerFeedback deadline must be after selfReview deadline"]
}
```

---

### Start Review Cycle (Admin Only)

```
POST /api/v1/performance-reviews/cycles/:cycleId/start
```

**Authorization**: `HR_ADMIN` role required

**Response** (200 OK):
```json
{
  "id": "cycle-uuid",
  "status": "ACTIVE",
  "startedAt": "2025-02-01T00:00:00Z"
}
```

---

## 2. Self-Review

### Get My Self-Review

```
GET /api/v1/performance-reviews/cycles/:cycleId/self-review
```

**Authorization**: Authenticated user (returns their own review)

**Response** (200 OK):
```json
{
  "id": "review-uuid",
  "cycleId": "cycle-uuid",
  "status": "DRAFT",
  "scores": {
    "projectImpact": 3,
    "direction": 2,
    "engineeringExcellence": 4,
    "operationalOwnership": 3,
    "peopleImpact": 3
  },
  "narrative": "This year, I focused on...",
  "wordCount": 456,
  "submittedAt": null,
  "createdAt": "2025-02-01T10:00:00Z",
  "updatedAt": "2025-02-10T15:30:00Z"
}
```

**Response** (404 Not Found):
```json
{
  "statusCode": 404,
  "message": "Self-review not found for this cycle"
}
```

---

### Create/Update Self-Review

```
PUT /api/v1/performance-reviews/cycles/:cycleId/self-review
```

**Authorization**: Authenticated user

**Request Body**:
```json
{
  "scores": {
    "projectImpact": 3,
    "direction": 2,
    "engineeringExcellence": 4,
    "operationalOwnership": 3,
    "peopleImpact": 3
  },
  "narrative": "This year, I focused on improving our CI/CD pipeline..."
}
```

**Validation**:
- All scores required (integers 0-4)
- Narrative required (max 1000 words)
- Cannot submit after deadline

**Response** (200 OK):
```json
{
  "id": "review-uuid",
  "status": "DRAFT",
  "scores": { ... },
  "narrative": "...",
  "wordCount": 456,
  "updatedAt": "2025-02-10T15:30:00Z"
}
```

**Error** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    "Narrative exceeds 1000 word limit (current: 1234 words)",
    "projectImpact must be between 0 and 4"
  ]
}
```

---

### Submit Self-Review

```
POST /api/v1/performance-reviews/cycles/:cycleId/self-review/submit
```

**Authorization**: Authenticated user

**Request Body**: None

**Response** (200 OK):
```json
{
  "id": "review-uuid",
  "status": "SUBMITTED",
  "submittedAt": "2025-02-14T18:00:00Z"
}
```

**Error** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": "Cannot submit incomplete self-review",
  "errors": ["Narrative is required"]
}
```

**Error** (403 Forbidden):
```json
{
  "statusCode": 403,
  "message": "Self-review deadline has passed",
  "deadline": "2025-02-15T23:59:59Z"
}
```

---

## 3. Peer Nominations & Feedback

### Nominate Peers

```
POST /api/v1/performance-reviews/cycles/:cycleId/peer-nominations
```

**Authorization**: Authenticated user

**Request Body**:
```json
{
  "nomineeIds": [
    "user-uuid-1",
    "user-uuid-2",
    "user-uuid-3"
  ]
}
```

**Validation**:
- 3-5 nominees required
- Cannot nominate self
- Cannot nominate manager
- All nominees must be active users

**Response** (201 Created):
```json
{
  "nominations": [
    {
      "id": "nomination-uuid-1",
      "nomineeId": "user-uuid-1",
      "nomineeName": "Jane Doe",
      "status": "PENDING",
      "nominatedAt": "2025-02-14T10:00:00Z"
    },
    {
      "id": "nomination-uuid-2",
      "nomineeId": "user-uuid-2",
      "nomineeName": "John Smith",
      "status": "PENDING",
      "nominatedAt": "2025-02-14T10:00:00Z"
    }
  ]
}
```

---

### Get Peer Feedback Requests (As Reviewer)

```
GET /api/v1/performance-reviews/cycles/:cycleId/peer-feedback/requests
```

**Authorization**: Authenticated user

**Response** (200 OK):
```json
{
  "requests": [
    {
      "nominationId": "nomination-uuid",
      "revieweeId": "user-uuid",
      "revieweeName": "Alice Johnson",
      "revieweeLevel": "SENIOR",
      "revieweeDepartment": "Platform Engineering",
      "status": "PENDING",
      "deadline": "2025-03-01T23:59:59Z"
    }
  ],
  "total": 3
}
```

---

### Submit Peer Feedback

```
POST /api/v1/performance-reviews/cycles/:cycleId/peer-feedback
```

**Authorization**: Authenticated user (must be nominated peer)

**Request Body**:
```json
{
  "revieweeId": "user-uuid",
  "scores": {
    "projectImpact": 3,
    "direction": 3,
    "engineeringExcellence": 4,
    "operationalOwnership": 3,
    "peopleImpact": 3
  },
  "strengths": "Alice demonstrates exceptional technical leadership...",
  "growthAreas": "Could improve communication in cross-team settings...",
  "generalComments": "Strong performer overall"
}
```

**Validation**:
- All scores required (0-4)
- Reviewee ID must match pending nomination
- Comments optional

**Response** (201 Created):
```json
{
  "id": "feedback-uuid",
  "revieweeId": "user-uuid",
  "submittedAt": "2025-02-28T14:30:00Z",
  "isAnonymized": true
}
```

---

### Get Peer Feedback (As Reviewee - Anonymized)

```
GET /api/v1/performance-reviews/cycles/:cycleId/peer-feedback
```

**Authorization**: Authenticated user (returns their own received feedback)

**Response** (200 OK):
```json
{
  "aggregatedScores": {
    "projectImpact": 3.2,
    "direction": 2.8,
    "engineeringExcellence": 3.6,
    "operationalOwnership": 3.0,
    "peopleImpact": 3.4
  },
  "feedbackCount": 5,
  "anonymizedComments": [
    {
      "strengths": "Strong technical skills, great mentor",
      "growthAreas": "Could improve documentation practices"
    },
    {
      "strengths": "Excellent collaboration across teams",
      "growthAreas": "Sometimes misses deadlines"
    }
  ]
}
```

**Note**: Individual peer identities are NOT revealed. Manager sees attributed feedback.

---

## 4. Manager Evaluations

### Get Team Reviews (Manager Only)

```
GET /api/v1/performance-reviews/cycles/:cycleId/team-reviews
```

**Authorization**: Manager role

**Response** (200 OK):
```json
{
  "reviews": [
    {
      "employeeId": "user-uuid-1",
      "employeeName": "Alice Johnson",
      "employeeLevel": "SENIOR",
      "selfReviewStatus": "SUBMITTED",
      "peerFeedbackCount": 5,
      "peerFeedbackStatus": "COMPLETE",
      "managerEvalStatus": "DRAFT",
      "hasSubmittedEvaluation": false
    },
    {
      "employeeId": "user-uuid-2",
      "employeeName": "Bob Williams",
      "employeeLevel": "MID",
      "selfReviewStatus": "SUBMITTED",
      "peerFeedbackCount": 4,
      "peerFeedbackStatus": "COMPLETE",
      "managerEvalStatus": "SUBMITTED",
      "hasSubmittedEvaluation": true
    }
  ],
  "total": 2
}
```

---

### Get Employee Review Details (Manager Only)

```
GET /api/v1/performance-reviews/cycles/:cycleId/employees/:employeeId/review
```

**Authorization**: Manager of employee OR HR_ADMIN

**Response** (200 OK):
```json
{
  "employee": {
    "id": "user-uuid",
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "level": "SENIOR",
    "department": "Platform Engineering"
  },
  "selfReview": {
    "scores": { ... },
    "narrative": "...",
    "submittedAt": "2025-02-14T18:00:00Z"
  },
  "peerFeedback": {
    "count": 5,
    "aggregatedScores": { ... },
    "attributedFeedback": [
      {
        "reviewerId": "peer-uuid-1",
        "reviewerName": "Jane Doe",
        "scores": { ... },
        "strengths": "...",
        "growthAreas": "..."
      }
    ]
  },
  "managerEvaluation": {
    "id": "eval-uuid",
    "status": "DRAFT",
    "scores": null,
    "narrative": null
  }
}
```

**Note**: Manager sees attributed peer feedback (with reviewer names). Employee sees anonymized.

---

### Submit Manager Evaluation

```
POST /api/v1/performance-reviews/cycles/:cycleId/employees/:employeeId/evaluation
```

**Authorization**: Manager of employee

**Request Body**:
```json
{
  "scores": {
    "projectImpact": 3,
    "direction": 3,
    "engineeringExcellence": 4,
    "operationalOwnership": 3,
    "peopleImpact": 3
  },
  "narrative": "Alice had a strong year...",
  "strengths": "Technical excellence, mentorship",
  "growthAreas": "Strategic thinking, cross-team communication",
  "developmentPlan": "Focus on architecture design, lead cross-org initiative"
}
```

**Validation**:
- All scores required (0-4)
- All text fields required
- Cannot submit before peer feedback deadline

**Response** (201 Created):
```json
{
  "id": "eval-uuid",
  "employeeId": "user-uuid",
  "status": "SUBMITTED",
  "scores": { ... },
  "submittedAt": "2025-03-14T16:00:00Z"
}
```

---

## 5. Calibration

### Get Calibration Dashboard (Calibrator/HR_ADMIN)

```
GET /api/v1/performance-reviews/cycles/:cycleId/calibration
```

**Authorization**: CALIBRATOR or HR_ADMIN

**Query Parameters**:
- `department?: string` - Filter by department

**Response** (200 OK):
```json
{
  "summary": {
    "totalEvaluations": 50,
    "byBonusTier": {
      "EXCEEDS": 8,  // 16% - above target of 10-15%
      "MEETS": 35,   // 70% - within target
      "BELOW": 7     // 14% - above target of 5-10%
    },
    "byDepartment": {
      "Platform Engineering": {
        "EXCEEDS": 5,
        "MEETS": 15,
        "BELOW": 2
      },
      "Product Engineering": {
        "EXCEEDS": 3,
        "MEETS": 20,
        "BELOW": 5
      }
    }
  },
  "evaluations": [
    {
      "employeeId": "user-uuid",
      "employeeName": "Alice Johnson",
      "level": "SENIOR",
      "department": "Platform Engineering",
      "managerId": "manager-uuid",
      "managerName": "Carol Manager",
      "scores": { ... },
      "weightedScore": 3.3,
      "percentageScore": 82.5,
      "bonusTier": "MEETS",
      "calibrationStatus": "PENDING"
    }
  ]
}
```

---

### Create Calibration Session

```
POST /api/v1/performance-reviews/cycles/:cycleId/calibration/sessions
```

**Authorization**: CALIBRATOR or HR_ADMIN

**Request Body**:
```json
{
  "name": "Platform Engineering Calibration",
  "department": "Platform Engineering",
  "facilitatorId": "user-uuid",
  "participantIds": ["manager-uuid-1", "manager-uuid-2"],
  "scheduledAt": "2025-03-25T14:00:00Z"
}
```

**Response** (201 Created):
```json
{
  "id": "session-uuid",
  "name": "Platform Engineering Calibration",
  "status": "SCHEDULED",
  "scheduledAt": "2025-03-25T14:00:00Z",
  "participantCount": 2
}
```

---

### Apply Calibration Adjustment

```
POST /api/v1/performance-reviews/calibration/sessions/:sessionId/adjustments
```

**Authorization**: CALIBRATOR or HR_ADMIN

**Request Body**:
```json
{
  "evaluationId": "eval-uuid",
  "adjustedScores": {
    "projectImpact": 3,
    "direction": 2,  // Adjusted from 3
    "engineeringExcellence": 4,
    "operationalOwnership": 3,
    "peopleImpact": 3
  },
  "justification": "Normalized direction score to align with peer performance in same level"
}
```

**Validation**:
- Justification required (min 20 chars)
- At least one score must change from original
- Evaluation must belong to session's cycle

**Response** (201 Created):
```json
{
  "id": "adjustment-uuid",
  "evaluationId": "eval-uuid",
  "originalScores": { ... },
  "adjustedScores": { ... },
  "oldWeightedScore": 3.3,
  "newWeightedScore": 3.1,
  "oldBonusTier": "MEETS",
  "newBonusTier": "MEETS",
  "adjustedAt": "2025-03-25T15:30:00Z"
}
```

---

### Lock Final Scores

```
POST /api/v1/performance-reviews/cycles/:cycleId/scores/lock
```

**Authorization**: HR_ADMIN only

**Request Body**: None

**Response** (200 OK):
```json
{
  "cycleId": "cycle-uuid",
  "totalScoresLocked": 50,
  "lockedAt": "2025-03-30T16:00:00Z"
}
```

**Effect**: All final scores are locked and cannot be changed except via score adjustment request.

---

## 6. Post-Calibration Score Adjustments

### Request Score Adjustment

```
POST /api/v1/performance-reviews/cycles/:cycleId/employees/:employeeId/adjustment-request
```

**Authorization**: Manager of employee

**Request Body**:
```json
{
  "reason": "New project completion after calibration warrants score increase",
  "proposedScores": {
    "projectImpact": 4,  // Increase from 3
    "direction": 3,
    "engineeringExcellence": 4,
    "operationalOwnership": 3,
    "peopleImpact": 3
  }
}
```

**Response** (201 Created):
```json
{
  "id": "request-uuid",
  "employeeId": "user-uuid",
  "status": "PENDING",
  "reason": "...",
  "requestedAt": "2025-04-01T10:00:00Z"
}
```

---

### Get Pending Adjustment Requests (HR_ADMIN)

```
GET /api/v1/performance-reviews/adjustment-requests?status=PENDING
```

**Authorization**: HR_ADMIN

**Response** (200 OK):
```json
{
  "requests": [
    {
      "id": "request-uuid",
      "employeeId": "user-uuid",
      "employeeName": "Alice Johnson",
      "requesterId": "manager-uuid",
      "requesterName": "Carol Manager",
      "reason": "...",
      "currentScores": { ... },
      "proposedScores": { ... },
      "requestedAt": "2025-04-01T10:00:00Z"
    }
  ]
}
```

---

### Approve/Reject Adjustment Request

```
POST /api/v1/performance-reviews/adjustment-requests/:requestId/review
```

**Authorization**: HR_ADMIN

**Request Body**:
```json
{
  "action": "APPROVED",  // or "REJECTED"
  "rejectionReason": null  // Required if REJECTED
}
```

**Response** (200 OK):
```json
{
  "id": "request-uuid",
  "status": "APPROVED",
  "reviewedAt": "2025-04-02T14:00:00Z",
  "approvedBy": "hr-admin-uuid"
}
```

**Effect**: If approved, the final score is updated with new scores.

---

## 7. Final Scores

### Get My Final Score

```
GET /api/v1/performance-reviews/cycles/:cycleId/my-score
```

**Authorization**: Authenticated user

**Response** (200 OK):
```json
{
  "employee": {
    "id": "user-uuid",
    "name": "Alice Johnson",
    "level": "SENIOR"
  },
  "cycle": {
    "id": "cycle-uuid",
    "name": "2025 Annual Review",
    "year": 2025
  },
  "scores": {
    "projectImpact": 3,
    "direction": 3,
    "engineeringExcellence": 4,
    "operationalOwnership": 3,
    "peopleImpact": 3
  },
  "peerFeedbackSummary": {
    "averageScores": { ... },
    "count": 5
  },
  "weightedScore": 3.3,
  "percentageScore": 82.5,
  "bonusTier": "MEETS",
  "isLocked": true,
  "feedbackDelivered": true,
  "feedbackDeliveredAt": "2025-04-10T15:00:00Z"
}
```

---

### Get Team Final Scores (Manager)

```
GET /api/v1/performance-reviews/cycles/:cycleId/team-scores
```

**Authorization**: Manager

**Response** (200 OK):
```json
{
  "teamScores": [
    {
      "employeeId": "user-uuid-1",
      "employeeName": "Alice Johnson",
      "level": "SENIOR",
      "weightedScore": 3.3,
      "percentageScore": 82.5,
      "bonusTier": "MEETS",
      "feedbackDelivered": true
    },
    {
      "employeeId": "user-uuid-2",
      "employeeName": "Bob Williams",
      "level": "MID",
      "weightedScore": 3.5,
      "percentageScore": 87.5,
      "bonusTier": "EXCEEDS",
      "feedbackDelivered": false
    }
  ]
}
```

---

### Mark Feedback Delivered

```
POST /api/v1/performance-reviews/cycles/:cycleId/employees/:employeeId/feedback-delivered
```

**Authorization**: Manager of employee

**Request Body**: None

**Response** (200 OK):
```json
{
  "employeeId": "user-uuid",
  "feedbackDelivered": true,
  "feedbackDeliveredAt": "2025-04-10T15:00:00Z"
}
```

---

## 8. Reports & Analytics (HR_ADMIN)

### Get Cycle Statistics

```
GET /api/v1/performance-reviews/cycles/:cycleId/statistics
```

**Authorization**: HR_ADMIN

**Response** (200 OK):
```json
{
  "cycleId": "cycle-uuid",
  "name": "2025 Annual Review",
  "year": 2025,
  "completionStats": {
    "totalEmployees": 50,
    "selfReviewsCompleted": 50,
    "peerFeedbackCompleted": 245,  // 50 employees × ~5 peers
    "managerEvalsCompleted": 50,
    "finalScoresLocked": 50,
    "feedbackDelivered": 48
  },
  "scoreDistribution": {
    "byBonusTier": {
      "EXCEEDS": 7,   // 14%
      "MEETS": 38,    // 76%
      "BELOW": 5      // 10%
    },
    "byLevel": {
      "JUNIOR": { "avg": 2.8, "count": 10 },
      "MID": { "avg": 3.1, "count": 20 },
      "SENIOR": { "avg": 3.3, "count": 15 },
      "LEAD": { "avg": 3.5, "count": 4 },
      "MANAGER": { "avg": 3.2, "count": 1 }
    },
    "byDepartment": {
      "Platform Engineering": { "avg": 3.2, "count": 22 },
      "Product Engineering": { "avg": 3.1, "count": 28 }
    }
  },
  "calibrationSummary": {
    "sessionsHeld": 3,
    "adjustmentsMade": 12,
    "avgAdjustmentMagnitude": 0.3
  }
}
```

---

### Export Cycle Data (CSV)

```
GET /api/v1/performance-reviews/cycles/:cycleId/export
```

**Authorization**: HR_ADMIN

**Query Parameters**:
- `format: string` - "csv" or "json" (default: csv)

**Response** (200 OK):
- Content-Type: `text/csv` or `application/json`
- Downloads CSV/JSON file with all evaluation data

**CSV Columns**:
```
Employee ID, Name, Email, Level, Department, Manager Name,
Project Impact, Direction, Engineering Excellence, Operational Ownership, People Impact,
Weighted Score, Percentage Score, Bonus Tier,
Peer Avg Project Impact, Peer Avg Direction, ..., Peer Feedback Count,
Calibration Adjusted (Yes/No), Feedback Delivered (Yes/No)
```

---

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": ["Field-specific error messages"]
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions to access this resource"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Resource not found"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Self-review already submitted for this cycle"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "timestamp": "2025-04-01T10:30:00Z"
}
```

---

## Swagger/OpenAPI Documentation

All endpoints will be documented with Swagger annotations:

```typescript
@ApiTags('Performance Reviews')
@ApiBearerAuth('JWT-auth')
@Controller('performance-reviews')
export class PerformanceReviewsController {
  @ApiOperation({ summary: 'Get my self-review for a cycle' })
  @ApiResponse({ status: 200, description: 'Self-review found', type: SelfReviewResponseDto })
  @ApiResponse({ status: 404, description: 'Self-review not found' })
  @Get('cycles/:cycleId/self-review')
  async getMySelfReview(@Param('cycleId') cycleId: string, @CurrentUser() user: User) {
    // ...
  }
}
```

---

## Summary

This API contract provides:

- ✅ **Full review cycle workflow**: Self-review → Peer feedback → Manager evaluation → Calibration → Delivery
- ✅ **Role-based access control**: Different endpoints for USER, MANAGER, CALIBRATOR, HR_ADMIN
- ✅ **Anonymized peer feedback**: Reviewees see aggregated data, managers see attributed
- ✅ **Post-calibration adjustments**: Manager request + HR admin approval workflow
- ✅ **Comprehensive reporting**: Statistics, exports for HR
- ✅ **RESTful design**: Standard HTTP methods, predictable URL structure
- ✅ **Consistent error handling**: Standard error response format
- ✅ **Swagger documentation**: All endpoints fully documented

**Total Endpoints**: ~30 endpoints covering all use cases
