# Feature Specification: Performance Evaluation System

**Feature ID**: 002
**Branch**: `feature/002-performance-evaluation-system`
**Created**: 2025-12-12
**Status**: Planning
**Source**: specs/Platform-Engineering-Evaluation-Framework-v2.docx.pdf

---

## Executive Summary

Build a comprehensive web-based performance evaluation system for engineering teams that implements Meta's proven 5-pillar evaluation framework with level-scaled weightings. The system will support the full annual review cycle including self-reviews, peer feedback collection, manager evaluations, scoring calculation, and calibration workflows.

### Core Value Proposition

- **Fair & Transparent**: Standardized scoring rubric (0-4) applied consistently across all engineers
- **Level-Appropriate**: Dynamic weighting based on engineer level (Junior, Mid, Senior, Lead, Manager)
- **Multi-Perspective**: Combines self-assessment, peer feedback (3-5 reviewers), and manager evaluation
- **Data-Driven Bonus**: Weighted scores determine bonus tier (Exceeds ≥85%, Meets 50-84%, Below <50%)
- **Quality Calibration**: Normalization process ensures consistency across teams and prevents score inflation

---

## Business Context

### Problem Statement

Engineering performance evaluations currently lack:
1. Standardized evaluation criteria across different levels and teams
2. Systematic peer feedback collection and aggregation
3. Transparent scoring methodology for bonus determination
4. Calibration mechanisms to normalize scores across teams
5. Self-service tools for engineers to track their development against clear criteria

### Success Criteria

1. **Adoption**: 100% of engineering team completes annual review cycle
2. **Quality**: Average peer feedback count ≥ 4 per engineer
3. **Timeliness**: Full review cycle completed within 6-week window
4. **Satisfaction**: >80% of engineers report the process is fair and transparent
5. **Calibration**: Score distribution normalized across teams (no single team with all top performers)

---

## Functional Requirements

### 1. Five-Pillar Evaluation Framework

Each engineer is evaluated across 5 dimensions with level-scaled weights:

#### Pillar 1: Project Impact (20-35% weight)
- **Scope**: Technical execution, code quality, project delivery, cross-team collaboration
- **Weight by Level**:
  - Junior: 20%
  - Mid: 25%
  - Senior: 30%
  - Lead: 30%
  - Manager: 35%

#### Pillar 2: Direction (10-25% weight)
- **Scope**: Technical vision, architectural decisions, strategic planning, roadmap ownership
- **Weight by Level**:
  - Junior: 10%
  - Mid: 15%
  - Senior: 20%
  - Lead: 25%
  - Manager: 25%

#### Pillar 3: Engineering Excellence (25-20% weight)
- **Scope**: Code quality, testing, performance optimization, technical debt management, best practices
- **Weight by Level**:
  - Junior: 25%
  - Mid: 25%
  - Senior: 20%
  - Lead: 20%
  - Manager: 15%

#### Pillar 4: Operational Ownership (20-15% weight)
- **Scope**: Reliability, monitoring, incident response, on-call, production support
- **Weight by Level**:
  - Junior: 20%
  - Mid: 20%
  - Senior: 15%
  - Lead: 15%
  - Manager: 10%

#### Pillar 5: People Impact (25-15% weight)
- **Scope**: Mentorship, knowledge sharing, team culture, collaboration, leadership
- **Weight by Level**:
  - Junior: 25%
  - Mid: 15%
  - Senior: 15%
  - Lead: 10%
  - Manager: 15%

**Note**: Weights must sum to 100% for each level.

### 2. Scoring Rubric

Each pillar is scored on a 0-4 scale:

| Score | Label | Description | Expected Frequency |
|-------|-------|-------------|-------------------|
| 0 | Not Applicable | Pillar not relevant for role | Rare |
| 1 | Below Expectations | Consistently underperforming vs level expectations | 5-10% |
| 2 | Meets Expectations | Solid performance, meets all core responsibilities | 60-70% |
| 3 | Exceeds Expectations | Strong performance, goes beyond core responsibilities | 20-25% |
| 4 | Outstanding | Exceptional impact, far exceeds level expectations | 5-10% |

### 3. Annual Review Cycle

#### Phase 1: Self-Review (Week 1-2)
- Engineer submits self-assessment for each pillar
- Text input: 1000 words maximum (system-enforced)
- Score self on 0-4 scale for each pillar
- Identify growth areas and goals for next cycle

#### Phase 2: Peer Feedback (Week 2-4)
- Engineer nominates 3-5 peers for feedback
- Manager can add/modify peer list
- Peers receive notification to provide feedback
- Peer feedback template includes:
  - Score (0-4) for each pillar
  - Qualitative comments (optional)
  - Strengths and growth areas
- Anonymized aggregation (peers see scores only, not individual identities)

#### Phase 3: Manager Evaluation (Week 4-5)
- Manager reviews:
  - Self-assessment
  - Aggregated peer feedback (scores + anonymized comments)
  - Project deliverables and metrics
- Manager provides:
  - Final score (0-4) for each pillar
  - Qualitative assessment
  - Development plan for next cycle

#### Phase 4: Calibration (Week 5-6)
- Managers meet in calibration sessions by org/department
- Review score distribution across teams
- Normalize scores to ensure consistency
- Adjust outliers with justification
- Final scores locked

#### Phase 5: Feedback Delivery (Week 6)
- Manager shares final evaluation with engineer
- Discuss strengths, growth areas, next cycle goals
- Engineer acknowledges review

### 4. Weighted Score Calculation

**Formula**:
```
Weighted Score = Σ (Pillar Score × Pillar Weight)
```

**Example (Senior Engineer)**:
- Project Impact: 3 × 30% = 0.90
- Direction: 2 × 20% = 0.40
- Engineering Excellence: 4 × 20% = 0.80
- Operational Ownership: 3 × 15% = 0.45
- People Impact: 3 × 15% = 0.45
- **Total**: 3.00 / 4.00 = **75%**

### 5. Bonus Determination

Final weighted score maps to bonus tier:

| Weighted Score | Rating | Bonus Tier | Expected Distribution |
|----------------|--------|------------|----------------------|
| ≥ 85% (≥3.4/4.0) | Exceeds Expectations | High | 10-15% |
| 50-84% (2.0-3.39/4.0) | Meets Expectations | Standard | 70-80% |
| < 50% (<2.0/4.0) | Below Expectations | Low/None | 5-10% |

---

## Technical Requirements

### 1. User Roles & Permissions

| Role | Permissions |
|------|------------|
| **Engineer** | Submit self-review, nominate peers, view own feedback, view final evaluation |
| **Peer Reviewer** | Provide feedback for assigned engineers (view limited context) |
| **Manager** | View team reviews, submit evaluations, participate in calibration, deliver feedback |
| **Calibrator** | View cross-team scores, adjust scores with justification, lock final scores |
| **Admin** | Configure review cycles, manage users, export reports, system settings |

### 2. Data Model

#### Core Entities

**User**
- id, email, name, level (Junior/Mid/Senior/Lead/Manager), managerId, department, role

**ReviewCycle**
- id, name, year, startDate, endDate, status (draft/active/calibration/completed)
- Phase deadlines for each stage

**SelfReview**
- id, userId, cycleId, pillarScores (JSON: {pillar: score}), narrative (text, max 1000 words)
- submittedAt, status (draft/submitted)

**PeerNomination**
- id, revieweeId, nominatedPeerId, cycleId, status (pending/accepted/declined)

**PeerFeedback**
- id, revieweeId, reviewerId, cycleId, pillarScores (JSON), comments (text), submittedAt

**ManagerEvaluation**
- id, employeeId, managerId, cycleId, pillarScores (JSON), narrative (text)
- developmentPlan (text), submittedAt, status (draft/submitted/calibrated)

**CalibrationSession**
- id, cycleId, departmentId, facilitatorId, scheduledAt, completedAt
- participants (userId[]), notes (text)

**CalibrationAdjustment**
- id, evaluationId, sessionId, originalScore, adjustedScore, justification (text)
- adjustedBy, adjustedAt

**FinalScore**
- id, userId, cycleId, pillarScores (JSON), weightedScore (float), percentageScore (float)
- bonusTier (Exceeds/Meets/Below), locked (boolean), lockedAt

### 3. Business Rules

1. **Self-Review Validation**
   - Cannot exceed 1000 words (enforce client-side + server-side)
   - All pillars must be scored
   - Can be saved as draft, requires explicit submission

2. **Peer Nomination**
   - Minimum 3 peers, maximum 5 peers
   - Cannot nominate self
   - Cannot nominate manager
   - Manager can override nominations

3. **Peer Feedback**
   - Required for nominated peers only
   - Can decline to review (with notification to manager)
   - Anonymized in aggregation (individual peer scores not visible to reviewee)

4. **Manager Evaluation**
   - Cannot submit until all peer feedback received or deadline passed
   - Can submit draft and revise before calibration
   - Locked after calibration

5. **Calibration**
   - Only managers and calibrators can participate
   - Score adjustments require justification
   - Distribution targets: ~10-15% Exceeds, ~70-80% Meets, ~5-10% Below
   - Final scores locked after calibration

6. **Weighted Score Calculation**
   - Automatically calculated based on level-specific weights
   - Updated whenever pillar scores change
   - Bonus tier auto-assigned based on percentage score

### 4. Non-Functional Requirements

**Performance**
- Page load time: < 2 seconds
- Score calculation: < 100ms
- Support 500 concurrent users during review cycle

**Security**
- Role-based access control (RBAC)
- Peer feedback anonymization
- Audit trail for all score changes
- Secure storage of sensitive feedback

**Usability**
- Mobile-responsive design
- Progress indicators for review cycle phases
- Email notifications for deadlines and pending actions
- Intuitive UI for managers reviewing multiple reports

**Data Integrity**
- Prevent score manipulation after calibration lock
- Backup peer feedback data
- Export capability for HR records

---

## User Stories

### Engineer Flow

**US-001**: As an engineer, I want to submit my self-review with scores for each pillar and a 1000-word narrative, so I can share my perspective on my performance.

**US-002**: As an engineer, I want to nominate 3-5 peers to provide feedback, so I receive diverse perspectives on my work.

**US-003**: As an engineer, I want to view aggregated peer feedback scores (anonymized), so I understand how my peers perceive my contributions.

**US-004**: As an engineer, I want to view my final evaluation and weighted score, so I understand my performance rating and bonus tier.

### Peer Reviewer Flow

**US-005**: As a peer reviewer, I want to provide scores and comments for engineers who nominated me, so I can contribute to their evaluation.

**US-006**: As a peer reviewer, I want to decline a review request if I don't have sufficient context, so I provide only meaningful feedback.

### Manager Flow

**US-007**: As a manager, I want to review my team's self-assessments and peer feedback, so I have comprehensive context for evaluations.

**US-008**: As a manager, I want to submit final evaluations with scores for each pillar and development plans, so I document performance and growth areas.

**US-009**: As a manager, I want to participate in calibration sessions and adjust scores with justification, so evaluations are consistent across teams.

**US-010**: As a manager, I want to deliver final feedback to my reports and discuss their evaluation, so they understand their performance and next steps.

### Admin Flow

**US-011**: As an admin, I want to configure annual review cycles with phase deadlines, so the process runs on schedule.

**US-012**: As an admin, I want to export evaluation data and bonus tier distribution, so HR can process compensation.

---

## Open Questions

1. **Peer Feedback Visibility**: Should engineers see individual peer scores or only aggregated averages?
2. **Score Adjustments**: Can managers adjust scores after calibration if new information emerges?
3. **Historical Data**: How many years of evaluation history should be retained and viewable?
4. **Integration**: Should this integrate with existing HR systems (e.g., Workday, BambooHR)?
5. **Anonymous Feedback**: Should peer comments be fully anonymized or attributed?
6. **Mid-Year Reviews**: Should the system support mid-year check-ins or only annual reviews?
7. **Growth Plans**: Should development plans be tracked and reviewed in subsequent cycles?
8. **Appeal Process**: Is there an appeal process if an engineer disagrees with their evaluation?

---

## Success Metrics

### Process Metrics
- **Completion Rate**: % of engineers who complete all review phases on time
- **Peer Participation**: Average # of peer reviews submitted per engineer
- **Calibration Coverage**: % of evaluations reviewed in calibration sessions

### Quality Metrics
- **Score Distribution**: Alignment with expected distribution (10-15% Exceeds, 70-80% Meets, 5-10% Below)
- **Feedback Quality**: Average word count and sentiment of peer/manager comments
- **Consistency**: Standard deviation of scores across teams (lower = more consistent)

### Outcome Metrics
- **Employee Satisfaction**: Survey score for fairness and transparency of process
- **Retention**: Correlation between evaluation scores and retention rates
- **Promotion Accuracy**: % of promoted employees who had "Exceeds" ratings

---

## Dependencies

1. **Authentication**: Keycloak OAuth integration (already implemented in Feature 001)
2. **User Management**: User database with level, manager hierarchy, department data
3. **Email Service**: Notification system for deadlines and pending actions
4. **File Storage**: Optional - for storing uploaded supporting documents (stretch goal)
5. **Reporting**: Data export and visualization tools for admins

---

## Constraints

1. **Timeline**: Must be production-ready before next annual review cycle (Q4 2026)
2. **Compliance**: Must support GDPR data export and deletion requests
3. **Scalability**: Must handle 500+ engineers across 50+ teams
4. **Mobile**: Must be fully functional on mobile devices (responsive design)

---

## Out of Scope (V1)

- Real-time collaboration on reviews (async only)
- Advanced analytics/dashboards (basic reports only)
- Integration with performance management tools (standalone for V1)
- Multi-language support (English only for V1)
- AI-assisted feedback generation
- 360-degree feedback (direct reports evaluating managers)

---

## References

- Source PDF: `specs/Platform-Engineering-Evaluation-Framework-v2.docx.pdf`
- Meta Engineering Levels: [Internal reference to level definitions]
- Constitution: `specs/constitution.md` (Clean Architecture, SOLID, TDD requirements)
