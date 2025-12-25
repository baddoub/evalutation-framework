# Feature Enhancement Plan

Based on analysis of reference performance review system screenshots, this document outlines proposed enhancements for the Evaluation Framework.

---

## 1. Navigation & Menu Restructuring

### Current State
- Basic sidebar with performance review items

### Proposed Enhancement
Restructure navigation to follow industry best practices:

```
Sidebar Navigation:
├── Employee Profile (new)
├── My Performance
│   ├── My Performance (overview)
│   ├── 360 Review
│   ├── Final Performance Report
│   ├── Post Project Reviews (new)
│   └── My Performance History (new)
├── 360 Review (quick access)
├── Post Project Reviews (new)
├── Reviewees (new - for independent reviewers)
└── Resources (new - help/documentation)
```

**Priority**: High
**Complexity**: Medium

---

## 2. Enhanced Employee Profile

### Current State
- No dedicated employee profile page

### Proposed Features

#### 2.1 Profile Header Card
- Employee photo/avatar with initials fallback
- Full name with title and **level badge** (e.g., AD1, AD3, M2)
- Practice/Department and Focus Area
- Key metrics display:
  - **Utilization Rate** (percentage with visual indicator)
  - **Last Rating** (1-5 scale)
  - **Career Track** (Specialist/Management)

#### 2.2 Professional Details Section
- Employee ID
- Employment Type (FTE, Contractor, etc.)
- Probation Status
- Line Manager
- Appointed Reviewer

#### 2.3 Timeline Section
- Join Date
- Last Promotion Date with cycle name
- Timesheet Compliance Status

**Priority**: High
**Complexity**: Medium

---

## 3. Exposure List (Project Assignments)

### Current State
- No project tracking within performance system

### Proposed Features

#### 3.1 Project Assignment Tracking
```typescript
interface ExposureItem {
  projectName: string
  projectManager: string
  startDate: Date
  endDate?: Date
  role: string
  allocationPercentage: number
}
```

#### 3.2 UI Components
- List view showing projects with:
  - Project name
  - Project Manager name
  - Duration/dates
- "See more (X more projects)" expandable link
- Integration with project management data source

**Priority**: Medium
**Complexity**: High (requires external integration)

---

## 4. Independent Reviewer System

### Current State
- Peer feedback through nomination

### Proposed Enhancement

#### 4.1 Reviewees Dashboard
A dedicated page for users who are independent reviewers showing:
- Greeting: "Hi [Name] ([Title]), You have been chosen to do the independent review of the following:"
- Card grid of reviewees with:
  - Avatar (photo or initials)
  - Name and email
  - Title and level
  - Completion status icons (checkmarks)

#### 4.2 Assessment Workflow
Side navigation for reviewing an employee:
- Self and Reviewer Assessment
- 360 & Wider Contribution
- Independent Reviewer Proposed Rating
- Committee Meetings Assessments
- Final Performance Report
- Post Project Reviews

**Priority**: High
**Complexity**: Medium

---

## 5. Overall Assessment Rating Display

### Current State
- Individual pillar scores shown

### Proposed Enhancement

#### 5.1 Dual Rating Circle Display
Visual component showing:
- **Self Assessment Score** (large circle, left)
- **Independent Reviewer Score** (large circle, right)
- Label: "Independently reviewed by [Reviewer Name]"

#### 5.2 Score Comparison View
For each competency pillar:
- Side-by-side layout:
  - Left column: **Reviewee rating** with dropdown and comment
  - Right column: **Your review** with dropdown and comment
- Pillar weighting display (e.g., "Weighting: 35")

**Priority**: Medium
**Complexity**: Low

---

## 6. Enhanced Rich Text Comments

### Current State
- Plain text input for narratives

### Proposed Enhancement

#### 6.1 Rich Text Editor
- Bold, Italic, Underline, Strikethrough formatting
- Bullet points/lists
- Character/word counter
- Auto-save drafts

#### 6.2 Pre-populated Competency Criteria
Display detailed expectations for each pillar to guide reviews:
```
Project Delivery (Weighting: 35)
• Highly utilized on client projects (60%+)
• Leads multiple technical workstreams or complex projects
• Designs, plans and delivers projects on time
• Communicates with clarity, precision, and gravitas
• Builds cohesive and insight-led storylines
```

**Priority**: Medium
**Complexity**: Medium

---

## 7. Post Project Reviews

### Current State
- Not implemented

### Proposed Features

#### 7.1 Project-Based Feedback
- Link reviews to specific projects
- Capture feedback at project completion
- Aggregate project reviews into performance assessment

#### 7.2 Data Model
```typescript
interface PostProjectReview {
  id: string
  projectId: string
  projectName: string
  revieweeId: string
  reviewerId: string
  rating: number
  strengths: string
  areasForImprovement: string
  submittedAt: Date
}
```

**Priority**: Low (Phase 2)
**Complexity**: High

---

## 8. Performance History

### Current State
- Only current cycle visible

### Proposed Features

#### 8.1 Historical View
- List of past performance cycles
- Final ratings per cycle
- Trend visualization (rating over time)
- Downloadable reports

#### 8.2 Promotion Tracking
- Highlight promotion milestones
- Track career progression

**Priority**: Low (Phase 2)
**Complexity**: Medium

---

## 9. Final Performance Report

### Current State
- Basic final score display

### Proposed Enhancement

#### 9.1 Status Tracking
Clear status indicators:
- "Waiting for Assessment" state with messaging
- Progress through review stages
- Completion percentage

#### 9.2 Report Generation
- Consolidated view of all inputs:
  - Self review summary
  - Manager evaluation summary
  - 360 feedback aggregation
  - Independent reviewer assessment
  - Calibration adjustments
- PDF export capability

**Priority**: Medium
**Complexity**: Medium

---

## 10. Level/Grade System

### Current State
- Engineer level as enum (IC1-IC5, M1-M3, D1)

### Proposed Enhancement

#### 10.1 Visual Level Badges
- Color-coded badges by level category
- Display format: "Associate Director, AD3"
- Career track indication (Specialist vs Management)

#### 10.2 Level Definitions
```typescript
enum ProfessionalLevel {
  // Associate levels
  A1 = 'A1', A2 = 'A2', A3 = 'A3',
  // Consultant levels
  C1 = 'C1', C2 = 'C2', C3 = 'C3',
  // Manager levels
  M1 = 'M1', M2 = 'M2', M3 = 'M3',
  // Associate Director levels
  AD1 = 'AD1', AD2 = 'AD2', AD3 = 'AD3',
  // Director levels
  D1 = 'D1', D2 = 'D2', D3 = 'D3'
}
```

**Priority**: Low
**Complexity**: Low

---

## Implementation Roadmap

### Phase 1: Core Enhancements (Next Sprint)
1. Navigation restructuring
2. Enhanced Employee Profile
3. Independent Reviewer dashboard (Reviewees page)
4. Dual rating circle display
5. Rich text editor for comments

### Phase 2: Feature Expansion
1. Exposure List / Project tracking
2. Post Project Reviews
3. Performance History
4. Enhanced Final Report generation

### Phase 3: Advanced Features
1. External system integrations (project management, HR)
2. Advanced analytics and reporting
3. Mobile-responsive enhancements

---

## Database Schema Additions

```prisma
model EmployeeProfile {
  id                 String    @id @default(uuid())
  userId             String    @unique
  photoUrl           String?
  professionalLevel  String
  practice           String?
  focusArea          String?
  careerTrack        String    @default("Specialist")
  employeeId         String?
  employmentType     String    @default("FTE")
  probationStatus    String?
  lineManagerId      String?
  appointedReviewerId String?
  joinedAt           DateTime?
  lastPromotionAt    DateTime?
  lastPromotionCycle String?
  timesheetCompliant Boolean   @default(true)
  utilizationRate    Float?
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
}

model ProjectAssignment {
  id                String    @id @default(uuid())
  userId            String
  projectName       String
  projectManagerName String
  projectManagerId  String?
  startDate         DateTime
  endDate           DateTime?
  role              String?
  allocation        Float     @default(100)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}

model PostProjectReview {
  id                String    @id @default(uuid())
  projectAssignmentId String
  revieweeId        String
  reviewerId        String
  cycleId           String?
  rating            Int
  strengths         String?
  improvements      String?
  submittedAt       DateTime  @default(now())
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}
```

---

## UI/UX Design Guidelines

Based on industry best practices:

1. **Profile Cards**: Use avatar with initials fallback, show key metrics prominently
2. **Status Indicators**: Green checkmarks for completed items
3. **Level Badges**: Color-coded, compact badges next to names
4. **Side-by-side Comparison**: For self vs reviewer assessments
5. **Expandable Lists**: "See more (X items)" pattern
6. **Rich Text**: Full formatting toolbar for narrative fields
7. **Circular Score Displays**: Large, prominent score circles
8. **Weighting Labels**: Show pillar weightings next to each section

---

## Notes

- Screenshots analyzed: 12 reference images from performance review systems
- Key differentiators identified: Independent reviewer flow, project exposure tracking, professional level system
- Recommended approach: Incremental implementation starting with navigation and profile enhancements
