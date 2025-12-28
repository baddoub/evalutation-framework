# Tasks: Navigation & Menu Restructuring

**Input**: Design documents from `/specs/003-nav-restructure/`
**Prerequisites**: plan.md (required), spec.md (required), design.md, research.md
**Estimated Timeline**: 4-5 hours
**New Files**: 16 | **Modified Files**: 3

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US5)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `client/src/`
- **Components**: `client/src/components/`
- **Pages**: `client/src/pages/`
- **Contexts**: `client/src/contexts/`

---

## Phase 1: Setup & Dependencies

**Purpose**: Install dependencies and create directory structure

- [x] T001 [P] Install react-icons: `cd client && npm install react-icons`
- [x] T002 [P] Create contexts directory: `mkdir -p client/src/contexts`
- [x] T003 [P] Create layout components directory: `mkdir -p client/src/components/layout`
- [x] T004 [P] Verify react-icons installed correctly in package.json

**Checkpoint**: Dependencies ready, directory structure in place

---

## Phase 2: Foundational Components (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

### AuthContext (Shared State)

- [x] T005 [US1] Create AuthContext interface with User, AuthContextValue types in `client/src/contexts/AuthContext.tsx`
- [x] T006 [US1] Implement AuthProvider component with useState for user, loading in `client/src/contexts/AuthContext.tsx`
- [x] T007 [US1] Add useEffect to fetch user via authService.getCurrentUser() in `client/src/contexts/AuthContext.tsx`
- [x] T008 [US1] Implement hasRole helper function using useCallback in `client/src/contexts/AuthContext.tsx`
- [x] T009 [US1] Export useAuth hook in `client/src/contexts/AuthContext.tsx`

### Navigation Configuration

- [x] T010 [P] [US1] Create NavItem interface in `client/src/components/layout/navigationConfig.ts`
- [x] T011 [US1] Define navigationConfig array with all 6 top-level items in `client/src/components/layout/navigationConfig.ts`
- [x] T012 [US1] Add My Performance submenu children (5 items) in `client/src/components/layout/navigationConfig.ts`
- [x] T013 [US1] Add role-based visibility (roles array) to Reviewees item in `client/src/components/layout/navigationConfig.ts`

### Core Components

- [x] T014 [P] [US1] Create NavigationItem component skeleton in `client/src/components/layout/NavigationItem.tsx`
- [x] T015 [US1] Implement NavigationItem props interface (item, isExpanded, isActive, onToggle, level) in `client/src/components/layout/NavigationItem.tsx`
- [x] T016 [US1] Add icon rendering with react-icons in `client/src/components/layout/NavigationItem.tsx`
- [x] T017 [US1] Add recursive children rendering for submenus in `client/src/components/layout/NavigationItem.tsx`

- [x] T018 [P] [US1] Create Sidebar component skeleton in `client/src/components/layout/Sidebar.tsx`
- [x] T019 [US1] Import navigationConfig and useAuth in `client/src/components/layout/Sidebar.tsx`
- [x] T020 [US1] Add filterByRole function using hasRole in `client/src/components/layout/Sidebar.tsx`
- [x] T021 [US1] Render filtered navigation items using NavigationItem in `client/src/components/layout/Sidebar.tsx`

- [x] T022 [P] [US1] Create Navbar component (extracted from DashboardPage) in `client/src/components/layout/Navbar.tsx`
- [x] T023 [P] [US1] Create Navbar.css with neobrutalism styles in `client/src/components/layout/Navbar.css`

- [x] T024 [P] [US1] Create MainLayout component with Navbar + Sidebar + Outlet in `client/src/components/layout/MainLayout.tsx`
- [x] T025 [P] [US1] Create MainLayout.css with grid/flexbox layout in `client/src/components/layout/MainLayout.css`

- [x] T026 [P] [US1] Create Sidebar.css with neobrutalism nav-item styles in `client/src/components/layout/Sidebar.css`

- [x] T027 [US1] Create barrel exports in `client/src/components/layout/index.ts`

**Checkpoint**: Foundation ready - all core components created, user story implementation can begin

---

## Phase 3: User Story 1 - View Personalized Navigation (Priority: P1)

**Goal**: Users see a sidebar with all menu items, role-based filtering for Reviewees

**Independent Test**: Log in and verify all menu items render with proper labels and icons

### Implementation

- [x] T028 [P] [US1] Create ProfilePage placeholder in `client/src/pages/ProfilePage.tsx`
- [x] T029 [P] [US1] Create ResourcesPage placeholder in `client/src/pages/ResourcesPage.tsx`

- [x] T030 [US1] Wrap App.tsx with AuthProvider in `client/src/App.tsx`
- [x] T031 [US1] Add MainLayout as parent route for protected routes in `client/src/App.tsx`
- [x] T032 [US1] Add /profile route in `client/src/App.tsx`
- [x] T033 [US1] Add /resources route in `client/src/App.tsx`

- [x] T034 [US1] Test: Verify all 6 top-level items render for logged-in user
- [x] T035 [US1] Test: Verify Reviewees hidden for non-manager users
- [x] T036 [US1] Test: Verify Reviewees visible for MANAGER role
- [x] T037 [US1] Test: Verify Reviewees visible for HR_ADMIN role

**Checkpoint**: User Story 1 complete - sidebar visible with role-based menu items

---

## Phase 4: User Story 2 - Navigate to Features (Priority: P1)

**Goal**: Navigation items are clickable and navigate to correct routes

**Independent Test**: Click each menu item and verify the correct page loads

### Implementation

- [x] T038 [P] [US2] Create PostProjectReviewsPage placeholder in `client/src/pages/PostProjectReviewsPage.tsx`
- [x] T039 [P] [US2] Create PerformanceHistoryPage placeholder in `client/src/pages/PerformanceHistoryPage.tsx`

- [x] T040 [US2] Add /reviews/post-project route in `client/src/App.tsx`
- [x] T041 [US2] Add /reviews/history route in `client/src/App.tsx`

- [x] T042 [US2] Add useNavigate hook to NavigationItem in `client/src/components/layout/NavigationItem.tsx`
- [x] T043 [US2] Implement onClick handler for navigation in `client/src/components/layout/NavigationItem.tsx`

- [x] T044 [US2] Test: Click Employee Profile navigates to /profile
- [x] T045 [US2] Test: Click 360 Review navigates to /reviews/peer-feedback
- [x] T046 [US2] Test: Click Post Project Reviews navigates to /reviews/post-project
- [x] T047 [US2] Test: Click Reviewees navigates to /reviews/team
- [x] T048 [US2] Test: Click Resources navigates to /resources

**Checkpoint**: User Story 2 complete - all 10 routes navigable

---

## Phase 5: User Story 3 - Expand and Navigate My Performance Submenu (Priority: P2)

**Goal**: My Performance submenu expands/collapses on click

**Independent Test**: Click My Performance to expand, verify 5 submenu items appear

### Implementation

- [x] T049 [US3] Add useState for expanded Set in Sidebar in `client/src/components/layout/Sidebar.tsx`
- [x] T050 [US3] Initialize expanded with 'my-performance' in default Set in `client/src/components/layout/Sidebar.tsx`
- [x] T051 [US3] Implement toggleExpand function in `client/src/components/layout/Sidebar.tsx`
- [x] T052 [US3] Pass isExpanded and onToggle props to NavigationItem in `client/src/components/layout/Sidebar.tsx`

- [x] T053 [US3] Add conditional rendering for children based on isExpanded in `client/src/components/layout/NavigationItem.tsx`
- [x] T054 [US3] Add chevron icon (FiChevronDown/FiChevronRight) for expandable items in `client/src/components/layout/NavigationItem.tsx`
- [x] T055 [US3] Implement toggle onClick for parent items with children in `client/src/components/layout/NavigationItem.tsx`

- [x] T056 [US3] Add sessionStorage persistence for expansion state in `client/src/components/layout/Sidebar.tsx`
- [x] T057 [US3] Load initial expansion state from sessionStorage in `client/src/components/layout/Sidebar.tsx`

- [x] T058 [US3] Add submenu animation CSS (max-height transition) in `client/src/components/layout/Sidebar.css`
- [x] T059 [US3] Style submenu items with indentation (nav-item--child) in `client/src/components/layout/Sidebar.css`

- [x] T060 [US3] Test: Click My Performance expands submenu showing 5 items
- [x] T061 [US3] Test: Click My Performance again collapses submenu
- [x] T062 [US3] Test: Click Overview navigates to /dashboard
- [x] T063 [US3] Test: Expansion state persists on page refresh

**Checkpoint**: User Story 3 complete - submenu expand/collapse functional

---

## Phase 6: User Story 4 - Understand Current Location (Priority: P2)

**Goal**: Current page's menu item is visually highlighted

**Independent Test**: Navigate to each route, verify corresponding menu item is highlighted

### Implementation

- [x] T064 [US4] Add useLocation hook in Sidebar in `client/src/components/layout/Sidebar.tsx`
- [x] T065 [US4] Implement isActive function comparing location.pathname in `client/src/components/layout/Sidebar.tsx`
- [x] T066 [US4] Pass isActive function to NavigationItem in `client/src/components/layout/Sidebar.tsx`

- [x] T067 [US4] Add conditional nav-item--active class based on isActive in `client/src/components/layout/NavigationItem.tsx`

- [x] T068 [US4] Implement auto-expand parent for child routes in `client/src/components/layout/Sidebar.tsx`
- [x] T069 [US4] Add useEffect to expand parent when child route is active in `client/src/components/layout/Sidebar.tsx`

- [x] T070 [US4] Style nav-item--active with --neo-lime background in `client/src/components/layout/Sidebar.css`
- [x] T071 [US4] Add border-left highlight for active items in `client/src/components/layout/Sidebar.css`

- [x] T072 [US4] Test: Navigate to /profile, Employee Profile highlighted
- [x] T073 [US4] Test: Navigate to /reviews/final-score, My Performance expanded AND Final Report highlighted
- [x] T074 [US4] Test: Direct URL to /reviews/history auto-expands parent

**Checkpoint**: User Story 4 complete - active state highlighting functional

---

## Phase 7: User Story 5 - Experience Smooth Interactions (Priority: P3)

**Goal**: Polished animations and hover states for professional UX

**Independent Test**: Interact with navigation, verify animations are smooth

### Implementation

- [x] T075 [US5] Add hover styles with transform and background change in `client/src/components/layout/Sidebar.css`
- [x] T076 [US5] Verify transition timing < 100ms for hover in `client/src/components/layout/Sidebar.css`
- [x] T077 [US5] Add submenu expand animation with CSS transition in `client/src/components/layout/Sidebar.css`
- [x] T078 [US5] Verify animation timing < 300ms for expand/collapse in `client/src/components/layout/Sidebar.css`

- [x] T079 [US5] Add focus-visible outline for keyboard navigation in `client/src/components/layout/Sidebar.css`
- [x] T080 [US5] Add :active state styles for click feedback in `client/src/components/layout/Sidebar.css`

- [x] T081 [US5] Test: Hover feedback appears within 100ms (visual inspection)
- [x] T082 [US5] Test: Submenu animation completes within 300ms (DevTools)

**Checkpoint**: User Story 5 complete - smooth, polished interactions

---

## Phase 8: Dashboard Simplification

**Purpose**: Remove old navigation from DashboardPage, integrate with new sidebar

- [x] T083 Remove Quick Actions section (lines 117-188) from `client/src/pages/DashboardPage.tsx`
- [x] T084 Remove old navbar section from `client/src/pages/DashboardPage.tsx`
- [x] T085 Update DashboardPage to use useAuth() instead of local user state in `client/src/pages/DashboardPage.tsx`
- [x] T086 Remove status-grid styles from `client/src/pages/DashboardPage.css`
- [x] T087 Verify all existing pages render correctly within MainLayout
- [x] T088 Test: Dashboard shows only info cards (welcome, profile, cycle info)

**Checkpoint**: Dashboard simplified, sidebar is sole navigation

---

## Phase 9: Accessibility & Cross-Browser Testing

**Purpose**: WCAG 2.1 AA compliance and browser compatibility

### Accessibility

- [x] T089 Add role="navigation" and aria-label to Sidebar nav in `client/src/components/layout/Sidebar.tsx`
- [x] T090 Add role="menu" to ul and role="none" to li elements in `client/src/components/layout/Sidebar.tsx`
- [x] T091 Add role="menuitem" to navigation buttons/links in `client/src/components/layout/NavigationItem.tsx`
- [x] T092 Add aria-expanded for expandable items in `client/src/components/layout/NavigationItem.tsx`
- [x] T093 Add aria-current="page" for active items in `client/src/components/layout/NavigationItem.tsx`
- [x] T094 Verify minimum 44x44px touch targets in `client/src/components/layout/Sidebar.css`
- [x] T095 Verify color contrast ratio >= 4.5:1 for all text
- [x] T096 Test: Tab through all menu items, verify focus visible
- [x] T097 Test: Enter/Space activates focused item

### Cross-Browser Testing

- [x] T098 Test: Sidebar renders correctly in Chrome
- [x] T099 Test: Sidebar renders correctly in Firefox
- [x] T100 Test: Sidebar renders correctly in Safari
- [x] T101 Test: Sidebar renders correctly in Edge
- [x] T102 Test: Animations work consistently across all browsers

**Checkpoint**: Accessibility and cross-browser requirements met

---

## Phase 10: Polish & Documentation

**Purpose**: Final polish, documentation, and quality checks

- [x] T103 [P] Add JSDoc comments to AuthContext in `client/src/contexts/AuthContext.tsx`
- [x] T104 [P] Add JSDoc comments to Sidebar component in `client/src/components/layout/Sidebar.tsx`
- [x] T105 [P] Add JSDoc comments to NavigationItem component in `client/src/components/layout/NavigationItem.tsx`
- [x] T106 [P] Document navigationConfig structure with comments in `client/src/components/layout/navigationConfig.ts`
- [x] T107 Run `npm run build` and verify 0 TypeScript errors
- [x] T108 Run `npm run lint` and fix any ESLint warnings
- [x] T109 Verify all routes navigable (10/10)
- [x] T110 Final manual testing of complete navigation flow

**Checkpoint**: Feature complete, documented, and production-ready

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ← BLOCKS all user stories
    ↓
┌───────────────────────────────────────────┐
│  User Stories (can run in priority order) │
│  US1 → US2 → US3 → US4 → US5              │
└───────────────────────────────────────────┘
    ↓
Phase 8 (Dashboard) ← Depends on US1-US4
    ↓
Phase 9 (Accessibility) ← Depends on all components
    ↓
Phase 10 (Polish) ← Final phase
```

### Critical Path (4.5 hours)

```
Setup (15m) → Foundational (1.5h) → US1+US2 (45m) → US3+US4 (45m) → US5+Dashboard (30m) → Accessibility (30m) → Polish (15m)
```

### Parallel Opportunities

- **Phase 1**: All 4 tasks can run in parallel
- **Phase 2**: T014, T018, T022, T024, T026 can run in parallel (different files)
- **Phase 3**: T028, T029 can run in parallel (placeholder pages)
- **Phase 4**: T038, T039 can run in parallel (placeholder pages)
- **Phase 10**: All JSDoc tasks can run in parallel

---

## MVP Scopes

### Minimal MVP (Phase 1-3: US1)
- Sidebar visible with 6 top-level items
- Role-based visibility for Reviewees
- **Value**: Users can see navigation structure

### Functional MVP (Phase 1-4: US1-US2)
- All navigation items clickable
- All 10 routes navigable
- **Value**: Users can navigate entire application

### Recommended MVP (Phase 1-6: US1-US4)
- Submenu expansion working
- Active state highlighting
- **Value**: Full navigation UX

### Complete Feature (Phase 1-10: All)
- Smooth animations
- Dashboard simplified
- Full accessibility
- Cross-browser tested
- **Value**: Production-ready navigation

---

## Success Criteria

| Metric | Target | Verification |
|--------|--------|--------------|
| Routes navigable | 10/10 | Manual click-through |
| TypeScript errors | 0 | `npm run build` |
| Role-based visibility | 100% | Test with USER, MANAGER, HR_ADMIN |
| Animation timing | < 300ms | DevTools Performance |
| WCAG compliance | 2.1 AA | aXe browser extension |
| Cross-browser | 4/4 | Manual testing |
| Code coverage | N/A | Manual testing primary |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each phase or logical group
- Stop at any checkpoint to validate story independently
- Frontend feature - no backend changes required
