# Navigation Restructuring - Research Report

**Feature**: Navigation & Menu Restructuring
**Date**: 2025-12-25

---

## Technical Context

### Current State Analysis

**No Sidebar Exists**: The current application has NO sidebar navigation. Navigation is done through:
1. Dashboard page with clickable "Quick Action" cards/tiles
2. Top navbar with brand title and logout button only
3. Direct route navigation via React Router

**Current Layout Architecture**:
- `App.tsx` - Central router with ProtectedRoute/PublicRoute wrappers
- `DashboardPage.tsx` - Main hub with navigation tiles (not a sidebar)
- Sticky top navbar with brand + logout
- Full-width content area below navbar

### Key Files Reference

| File | Purpose | Relevance |
|------|---------|-----------|
| `client/src/App.tsx` | Route configuration, ProtectedRoute | Route definitions, auth check pattern |
| `client/src/pages/DashboardPage.tsx` | Main dashboard, nav tiles, role checks | Pattern for role-based rendering |
| `client/src/services/authService.ts` | Auth state, getCurrentUser | User data with roles |
| `client/src/index.css` | Neobrutalism design system | CSS variables, utility classes |
| `client/src/pages/DashboardPage.css` | Dashboard styling | Navbar, card patterns |

---

## Codebase Patterns

### 1. Role-Based Visibility Pattern

**Location**: `client/src/pages/DashboardPage.tsx:49, 158-166, 176-187`

```typescript
const hasRole = (role: string) => user?.roles.includes(role)

// Usage
{hasRole('MANAGER') && (
  <div className="status-item active" onClick={() => navigate('/reviews/team')}>
    ...
  </div>
)}
```

**Decision**: Reuse this `hasRole()` helper pattern for sidebar role-based visibility.

### 2. User Data Fetching Pattern

**Location**: `client/src/pages/DashboardPage.tsx:21-42`

```typescript
const [user, setUser] = useState<User | null>(null)

useEffect(() => {
  const fetchData = async () => {
    const userData = await authService.getCurrentUser()
    setUser(userData)
  }
  fetchData()
}, [navigate])
```

**Decision**: Sidebar needs access to user data for role checking. Options:
- Lift user state to App.tsx and pass via props
- Create AuthContext to share user across components
- Fetch user in Sidebar component independently (duplicate calls)

**Assumed Decision**: Create AuthContext for shared user state - cleaner pattern for multiple components needing user data.

### 3. Navigation Pattern

**Location**: `client/src/pages/DashboardPage.tsx:120-188`

```typescript
onClick={() => navigate('/reviews/self-review')}
```

**Decision**: Use same `useNavigate()` hook from React Router for sidebar navigation.

### 4. CSS Patterns & Design System

**Location**: `client/src/index.css`

**Neobrutalism Design Variables**:
- Colors: `--neo-lime`, `--neo-cyan`, `--neo-pink`, etc.
- Borders: `--neo-border` (3px solid black), `--neo-border-thick` (4px)
- Shadows: `--neo-shadow` (4px 4px 0 black), offset shadows
- Transitions: `--neo-transition-fast` (0.1s), `--neo-transition-slow` (0.3s)
- Spacing: `--neo-space-1` through `--neo-space-24`

**Hover Pattern**:
```css
element:hover {
  transform: translate(-2px, -2px);
  box-shadow: var(--neo-shadow-md);
}
element:active {
  transform: translate(2px, 2px);
  box-shadow: none;
}
```

**Decision**: Follow these patterns for sidebar styling.

### 5. Layout Pattern

**Current**: Full-width content below sticky navbar
```
┌─────────────────────────────────────────┐
│ NAVBAR (sticky)                         │
├─────────────────────────────────────────┤
│                                         │
│        CONTENT (max-width: 1200px)      │
│                                         │
└─────────────────────────────────────────┘
```

**Proposed**: Sidebar + content layout
```
┌───────────────────────────────────────────┐
│ NAVBAR (sticky)                           │
├──────────┬────────────────────────────────┤
│ SIDEBAR  │                                │
│ (fixed   │       CONTENT                  │
│  240px)  │    (flex-grow)                 │
│          │                                │
└──────────┴────────────────────────────────┘
```

---

## Existing Routes

| Current Route | Page Component | Exists |
|---------------|----------------|--------|
| `/login` | LoginPage | Yes |
| `/register` | RegisterPage | Yes |
| `/dashboard` | DashboardPage | Yes |
| `/reviews/self-review` | SelfReviewPage | Yes |
| `/reviews/peer-nomination` | PeerNominationPage | Yes |
| `/reviews/peer-feedback` | PeerFeedbackPage | Yes |
| `/reviews/my-peer-feedback` | MyPeerFeedbackPage | Yes |
| `/reviews/team` | TeamReviewsPage | Yes |
| `/reviews/final-score` | MyFinalScorePage | Yes |
| `/reviews/admin/cycles` | AdminReviewCyclesPage | Yes |

### New Routes Required

| New Route | Purpose | Page Needed |
|-----------|---------|-------------|
| `/profile` | Employee Profile | New placeholder page |
| `/reviews/overview` | My Performance Overview | Redirect to dashboard or new page |
| `/reviews/360` | 360 Review | Redirect to `/reviews/peer-feedback` or new page |
| `/reviews/final-report` | Final Performance Report | Redirect to `/reviews/final-score` |
| `/reviews/post-project` | Post Project Reviews | New placeholder page |
| `/reviews/history` | Performance History | New placeholder page |
| `/reviewees` | Reviewees (managers) | Redirect to `/reviews/team` or new page |
| `/resources` | Resources/Help | New placeholder page |

**Decision**: For MVP, create placeholder pages or redirects. Full implementation is Phase 2.

---

## Technology Decisions

### Icon Library

**Researched Options**:
1. **React Icons** - Tree-shakeable, many icon sets (Feather, Material, etc.)
2. **Lucide React** - Modern Feather icons fork, excellent tree-shaking
3. **Heroicons** - Tailwind-style icons
4. **Custom SVG** - Manual icon management

**Decision**: Use **React Icons** with Feather Icons set (`Fi*` prefix)
- Already common in React ecosystem
- Tree-shakeable (only import what you use)
- Consistent style with neobrutalism aesthetic (clean lines)

**Rationale**: Feather icons are simple, line-based icons that work well with bold neobrutalism borders.

### State Management for Sidebar

**Options**:
1. **Local useState** - Simple, no sharing
2. **Context API** - Share user data across components
3. **Redux/Zustand** - Overkill for this feature

**Decision**: Use **Context API** for user/auth state
- Create `AuthContext` to provide user data + hasRole helper
- Sidebar and other components can consume via `useAuth()` hook
- sessionStorage for submenu expansion state persistence

**Rationale**: Context avoids prop drilling and duplicate API calls while keeping complexity low.

### Sidebar Component Architecture

**Decision**: Create modular components:
```
components/
  navigation/
    Sidebar.tsx           # Main container
    Sidebar.css           # Sidebar-specific styles
    NavigationItem.tsx    # Single nav item (handles submenu logic)
    navigationConfig.ts   # Menu structure configuration
```

**Rationale**: Separation of concerns, reusable NavigationItem for different menu structures.

---

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| SOLID - SRP | ✅ Pass | Sidebar component only handles navigation display |
| SOLID - OCP | ✅ Pass | NavigationConfig allows extension without modifying components |
| SOLID - LSP | ✅ Pass | N/A for frontend components |
| SOLID - ISP | ✅ Pass | Components have focused interfaces |
| SOLID - DIP | ✅ Pass | Uses navigation config abstraction |
| Clean Architecture | ⚠️ N/A | Frontend feature, layer separation applies differently |
| TDD | ✅ Required | Unit tests for Sidebar, NavigationItem required |
| TypeScript Strict | ✅ Required | All components fully typed |
| NestJS Best Practices | N/A | Frontend-only feature |

---

## Assumptions Made

1. **AuthContext over prop drilling**: Will create AuthContext for user state
2. **Placeholder pages for new routes**: Routes like `/profile`, `/resources` get placeholder pages
3. **Route redirects for existing features**: `/reviews/360` → `/reviews/peer-feedback`, `/reviewees` → `/reviews/team`
4. **sessionStorage for submenu state**: Expansion persists during session only
5. **Minimum screen width 1280px**: Desktop-focused, no mobile sidebar behavior for MVP

---

## Clarification Decisions (Resolved)

### Q1: Route Mapping Strategy
**Decision**: Mix of placeholders and redirects
- `/profile` → New placeholder page (ProfilePage.tsx)
- `/resources` → New placeholder page (ResourcesPage.tsx)
- `/reviews/overview` → Redirect to `/dashboard`
- `/reviews/360` → Redirect to `/reviews/peer-feedback`
- `/reviews/final-report` → Redirect to `/reviews/final-score`
- `/reviews/post-project` → New placeholder page (PostProjectReviewsPage.tsx)
- `/reviews/history` → New placeholder page (PerformanceHistoryPage.tsx)
- `/reviewees` → Redirect to `/reviews/team`

### Q2: AuthContext Creation
**Decision**: Create AuthContext for shared user state
- Cleaner pattern for multiple components needing user data
- Provides `useAuth()` hook with user, loading, hasRole helper
- Avoids prop drilling and duplicate API calls

### Q3: Submenu Expansion Default
**Decision**: Always expanded for discoverability
- My Performance submenu starts expanded
- Still collapsible via click
- State persisted in sessionStorage for user preference

### Q4: Dashboard Integration
**Decision**: Simplified dashboard
- Keep welcome card with active cycle info
- Keep profile info card
- Remove "Quick Actions" navigation tiles (replaced by sidebar)
- Dashboard becomes informational hub, sidebar handles navigation

---

## References

- `client/src/App.tsx` - Current route definitions
- `client/src/pages/DashboardPage.tsx` - Role-based rendering pattern
- `client/src/services/authService.ts` - User data structure
- `client/src/index.css` - Neobrutalism design tokens
- `specs/003-nav-restructure/spec.md` - Feature specification
- `specs/constitution.md` - Project principles
