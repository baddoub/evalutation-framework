# Implementation Plan: Navigation & Menu Restructuring

**Branch**: `003-nav-restructure` | **Date**: 2025-12-25 | **Spec**: `specs/003-nav-restructure/spec.md`
**Approach**: Pragmatic Balance

---

## Summary

Implement a persistent sidebar navigation system for the Evaluation Framework using AuthContext for shared user state, React Icons for iconography, and a config-driven menu structure. The sidebar replaces the dashboard Quick Actions tiles as the primary navigation mechanism.

**Primary Deliverables**:
1. AuthContext for shared authentication state
2. Sidebar component with role-based menu items
3. Submenu expansion for "My Performance"
4. Active route highlighting
5. 4 placeholder pages for new routes
6. Simplified dashboard (remove navigation tiles)

---

## Technical Context

**Language/Version**: TypeScript 5.x, React 18
**Primary Dependencies**: React Router 7, react-icons (new)
**Storage**: sessionStorage (submenu expansion state)
**Testing**: Jest + React Testing Library (manual testing primary)
**Target Platform**: Web (Desktop-first, Chrome/Firefox/Safari/Edge)
**Project Type**: Web application (NestJS backend + React frontend)
**Performance Goals**: Animation < 300ms, click response < 100ms
**Constraints**: WCAG 2.1 AA accessibility, neobrutalism design consistency
**Scale/Scope**: ~780 lines new code, 16 new files, 3 modified files

---

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| SOLID - SRP | ✅ Pass | Each component has single responsibility |
| SOLID - OCP | ✅ Pass | Extend via config, not modification |
| SOLID - DIP | ✅ Pass | Components depend on interfaces |
| TypeScript Strict | ✅ Required | All components fully typed |
| TDD | ⚠️ Partial | Manual testing primary, key unit tests |
| Clean Architecture | N/A | Frontend feature |

---

## Project Structure

### Documentation (this feature)

```text
specs/003-nav-restructure/
├── spec.md              # Feature specification
├── research.md          # Codebase research findings
├── design.minimal.md    # Minimal change approach
├── design.clean.md      # Clean architecture approach
├── design.pragmatic.md  # Pragmatic approach (chosen)
├── design.md            # Final design document
├── plan.md              # This file
├── data-model.md        # Data entities
└── contract.md          # API contracts (N/A - frontend only)
```

### Source Code Changes

```text
client/src/
├── contexts/
│   └── AuthContext.tsx              # NEW - Auth state provider
│
├── components/
│   └── layout/
│       ├── index.ts                 # NEW - Barrel exports
│       ├── MainLayout.tsx           # NEW - Layout wrapper
│       ├── MainLayout.css           # NEW
│       ├── Navbar.tsx               # NEW - Extracted from Dashboard
│       ├── Navbar.css               # NEW
│       ├── Sidebar.tsx              # NEW - Main navigation
│       ├── Sidebar.css              # NEW
│       ├── NavigationItem.tsx       # NEW - Nav item component
│       └── navigationConfig.ts      # NEW - Menu configuration
│
├── pages/
│   ├── ProfilePage.tsx              # NEW - Placeholder
│   ├── ResourcesPage.tsx            # NEW - Placeholder
│   ├── PostProjectReviewsPage.tsx   # NEW - Placeholder
│   ├── PerformanceHistoryPage.tsx   # NEW - Placeholder
│   └── DashboardPage.tsx            # MODIFIED - Remove Quick Actions
│
└── App.tsx                          # MODIFIED - Add AuthProvider, nested routes
```

---

## Implementation Phases

### Phase 1: Foundation (30 min)

**Goal**: Set up dependencies and AuthContext

**Tasks**:
1. Install react-icons: `npm install react-icons`
2. Create `client/src/contexts/AuthContext.tsx`
3. Test AuthContext provides user data

**Files Created**:
- `client/src/contexts/AuthContext.tsx`

**Verification**:
- [ ] react-icons installed
- [ ] AuthContext compiles without errors
- [ ] useAuth() hook works in test component

---

### Phase 2: Navigation Components (1.5 hrs)

**Goal**: Build sidebar components

**Tasks**:
1. Create `navigationConfig.ts` with menu structure
2. Create `NavigationItem.tsx` component
3. Create `Sidebar.tsx` component
4. Create `Navbar.tsx` (extract from DashboardPage)
5. Create all CSS files
6. Create `MainLayout.tsx`

**Files Created**:
- `client/src/components/layout/navigationConfig.ts`
- `client/src/components/layout/NavigationItem.tsx`
- `client/src/components/layout/Sidebar.tsx`
- `client/src/components/layout/Sidebar.css`
- `client/src/components/layout/Navbar.tsx`
- `client/src/components/layout/Navbar.css`
- `client/src/components/layout/MainLayout.tsx`
- `client/src/components/layout/MainLayout.css`
- `client/src/components/layout/index.ts`

**Verification**:
- [ ] Sidebar renders all menu items
- [ ] Submenu expands/collapses
- [ ] Icons display correctly
- [ ] Neobrutalism styling applied

---

### Phase 3: App Integration (1 hr)

**Goal**: Integrate sidebar into application

**Tasks**:
1. Update `App.tsx` with AuthProvider
2. Update `App.tsx` with nested routes using MainLayout
3. Create placeholder pages (ProfilePage, ResourcesPage, etc.)
4. Modify `DashboardPage.tsx` to remove Quick Actions

**Files Created**:
- `client/src/pages/ProfilePage.tsx`
- `client/src/pages/ResourcesPage.tsx`
- `client/src/pages/PostProjectReviewsPage.tsx`
- `client/src/pages/PerformanceHistoryPage.tsx`

**Files Modified**:
- `client/src/App.tsx`
- `client/src/pages/DashboardPage.tsx`
- `client/src/pages/DashboardPage.css`

**Verification**:
- [ ] All routes navigate correctly
- [ ] Sidebar visible on all authenticated pages
- [ ] Dashboard shows info cards only
- [ ] No console errors

---

### Phase 4: Polish & Testing (45 min)

**Goal**: Finalize and verify

**Tasks**:
1. Implement active state highlighting
2. Add role-based visibility for Reviewees
3. Verify accessibility (keyboard nav, ARIA)
4. Cross-browser testing
5. Fix any styling issues

**Verification**:
- [ ] Active route highlighted
- [ ] Reviewees hidden for non-managers
- [ ] Keyboard navigation works
- [ ] Works in Chrome, Firefox, Safari, Edge
- [ ] Animations smooth (< 300ms)

---

## File Change Summary

### New Files (16)

| File | Lines | Purpose |
|------|-------|---------|
| `contexts/AuthContext.tsx` | ~60 | Auth state provider |
| `components/layout/index.ts` | ~10 | Barrel exports |
| `components/layout/MainLayout.tsx` | ~25 | Layout wrapper |
| `components/layout/MainLayout.css` | ~40 | Layout styles |
| `components/layout/Navbar.tsx` | ~35 | Top navbar |
| `components/layout/Navbar.css` | ~60 | Navbar styles |
| `components/layout/Sidebar.tsx` | ~80 | Sidebar container |
| `components/layout/Sidebar.css` | ~120 | Sidebar styles |
| `components/layout/NavigationItem.tsx` | ~70 | Nav item component |
| `components/layout/navigationConfig.ts` | ~60 | Menu configuration |
| `pages/ProfilePage.tsx` | ~40 | Placeholder |
| `pages/ResourcesPage.tsx` | ~40 | Placeholder |
| `pages/PostProjectReviewsPage.tsx` | ~40 | Placeholder |
| `pages/PerformanceHistoryPage.tsx` | ~40 | Placeholder |

**Total new code**: ~780 lines

### Modified Files (3)

| File | Changes |
|------|---------|
| `App.tsx` | Add AuthProvider, nested routes with MainLayout |
| `pages/DashboardPage.tsx` | Remove Quick Actions section |
| `pages/DashboardPage.css` | Remove status-grid styles (optional cleanup) |

---

## Dependencies

### New Dependencies
```json
{
  "react-icons": "^5.x"
}
```

### Existing Dependencies (no changes)
- react-router-dom (already installed)
- React 18 (already installed)

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| CSS conflicts | Low | Medium | BEM naming, scoped styles |
| Route breaking | Low | High | Nested routes preserve existing |
| Performance | Low | Low | Memoization, minimal re-renders |
| Accessibility | Medium | Medium | ARIA checklist, keyboard testing |

---

## Rollback Plan

If issues arise:
1. Revert App.tsx to remove AuthProvider and nested routes
2. Revert DashboardPage.tsx to restore Quick Actions
3. Delete new component files
4. Uninstall react-icons

All changes are additive and easily reversible.

---

## Success Criteria

| Metric | Target | Verification |
|--------|--------|--------------|
| Routes navigable | 10/10 | Manual click-through |
| TypeScript errors | 0 | `npm run build` |
| Role-based visibility | 100% | Test with different roles |
| Animation timing | < 300ms | DevTools Performance |
| WCAG compliance | 2.1 AA | aXe browser extension |
| Cross-browser | 4/4 | Manual testing |

---

## Next Steps

After implementation plan approval:
1. Run `/sdd:03-tasks` to generate tasks.md with detailed implementation tasks
2. Run `/sdd:04-implement` to execute the implementation
3. Run `/tdd:write-tests` to add test coverage
