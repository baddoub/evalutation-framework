# Navigation & Menu Restructuring - Final Design

**Approach**: Pragmatic Balance
**Date**: 2025-12-25
**Status**: Approved

---

## Executive Summary

This design implements a **persistent sidebar navigation system** for the Evaluation Framework using a pragmatic approach that balances development speed with code quality. The solution uses AuthContext for shared user state, React Icons for professional iconography, and a config-driven menu structure.

**Key Metrics**:
- Timeline: 4-5 hours
- New files: 16
- Modified files: 3
- New code: ~780 lines
- New dependency: react-icons

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        App.tsx                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  AuthProvider                        │    │
│  │  ┌───────────────────────────────────────────────┐  │    │
│  │  │               BrowserRouter                    │  │    │
│  │  │  ┌─────────────────────────────────────────┐  │  │    │
│  │  │  │         AuthenticatedLayout             │  │  │    │
│  │  │  │  ┌──────────┬────────────────────────┐  │  │  │    │
│  │  │  │  │  Navbar  │                        │  │  │  │    │
│  │  │  │  ├──────────┼────────────────────────┤  │  │  │    │
│  │  │  │  │ Sidebar  │     Main Content       │  │  │  │    │
│  │  │  │  │          │       (Outlet)         │  │  │  │    │
│  │  │  │  └──────────┴────────────────────────┘  │  │  │    │
│  │  │  └─────────────────────────────────────────┘  │  │    │
│  │  └───────────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Design

### 1. AuthContext

**File**: `client/src/contexts/AuthContext.tsx`

**Purpose**: Centralize user authentication state and provide role-checking utilities.

**Interface**:
```typescript
interface AuthContextValue {
  user: User | null
  loading: boolean
  hasRole: (role: string) => boolean
}

interface User {
  id: string
  email: string
  name: string
  roles: string[]
}
```

**Responsibilities**:
- Fetch user data on mount (if authenticated)
- Provide `user` object to consumers
- Provide `hasRole()` helper for role-based visibility
- Handle loading state during fetch

---

### 2. Navigation Configuration

**File**: `client/src/components/layout/navigationConfig.ts`

**Purpose**: Single source of truth for menu structure.

**Interface**:
```typescript
interface NavItem {
  id: string
  label: string
  path?: string
  icon: React.ComponentType<{ className?: string }>
  children?: NavItem[]
  roles?: string[]
}
```

**Menu Structure**:
```
├── Employee Profile        → /profile
├── My Performance          (expandable)
│   ├── Overview            → /dashboard
│   ├── 360 Review          → /reviews/peer-feedback
│   ├── Final Report        → /reviews/final-score
│   ├── Post Project        → /reviews/post-project
│   └── History             → /reviews/history
├── 360 Review              → /reviews/peer-feedback
├── Post Project Reviews    → /reviews/post-project
├── Reviewees               → /reviews/team (MANAGER, HR_ADMIN only)
└── Resources               → /resources
```

---

### 3. Sidebar Component

**File**: `client/src/components/layout/Sidebar.tsx`

**Purpose**: Main navigation container that renders the menu.

**Features**:
- Consumes `useAuth()` for role-based filtering
- Manages submenu expansion state
- Detects active route via `useLocation()`
- Persists expansion state to sessionStorage

**State**:
```typescript
const [expanded, setExpanded] = useState<Set<string>>(new Set(['my-performance']))
```

---

### 4. NavigationItem Component

**File**: `client/src/components/layout/NavigationItem.tsx`

**Purpose**: Render individual navigation item (recursive for submenus).

**Props**:
```typescript
interface NavigationItemProps {
  item: NavItem
  isExpanded: boolean
  isActive: (path?: string) => boolean
  onToggle: (id: string) => void
  level?: number
}
```

**Behavior**:
- Items with `children`: Toggle expansion on click
- Items with `path`: Navigate on click
- Items at `level > 0`: Render with indentation

---

### 5. Navbar Component

**File**: `client/src/components/layout/Navbar.tsx`

**Purpose**: Top navigation bar with brand and user actions.

**Extracted from**: `DashboardPage.tsx` (lines 61-71)

---

### 6. MainLayout Component

**File**: `client/src/components/layout/MainLayout.tsx`

**Purpose**: Layout wrapper for authenticated pages.

**Structure**:
```tsx
<div className="app-layout">
  <Navbar />
  <div className="app-layout__body">
    <Sidebar />
    <main className="app-layout__main">
      <Outlet />
    </main>
  </div>
</div>
```

---

## Styling Approach

### CSS Files
- `Navbar.css` - Navbar styles (extracted from DashboardPage.css)
- `Sidebar.css` - Sidebar container and nav items
- `MainLayout.css` - Layout grid/flexbox

### Design Tokens (from index.css)
```css
/* Already defined - reuse these */
--neo-white, --neo-black, --neo-cream
--neo-lime, --neo-cyan, --neo-pink
--neo-border, --neo-border-thick
--neo-shadow, --neo-shadow-md
--neo-space-3, --neo-space-6
--neo-transition-fast
```

### Key Styles
```css
/* Sidebar */
.sidebar {
  width: 260px;
  min-width: 260px;
  background: var(--neo-white);
  border-right: var(--neo-border-thick);
  height: calc(100vh - 72px);
  position: sticky;
  top: 72px;
}

/* Nav Item */
.nav-item {
  display: flex;
  align-items: center;
  gap: var(--neo-space-3);
  padding: var(--neo-space-3) var(--neo-space-6);
  border-left: 4px solid transparent;
  transition: all var(--neo-transition-fast);
}

.nav-item:hover {
  background: var(--neo-lime);
  transform: translateX(4px);
}

.nav-item--active {
  background: var(--neo-lime);
  border-left-color: var(--neo-black);
  font-weight: var(--neo-font-bold);
}

.nav-item--child {
  padding-left: calc(var(--neo-space-6) * 2);
  background: var(--neo-gray-100);
}
```

---

## Route Configuration

### New Routes
| Route | Component | Type |
|-------|-----------|------|
| `/profile` | ProfilePage | Placeholder |
| `/resources` | ResourcesPage | Placeholder |
| `/reviews/post-project` | PostProjectReviewsPage | Placeholder |
| `/reviews/history` | PerformanceHistoryPage | Placeholder |

### Redirects (handled in navigation config)
| From | To | Method |
|------|-----|--------|
| `/reviews/overview` | `/dashboard` | Config path |
| `/reviews/360` | `/reviews/peer-feedback` | Config path |
| `/reviews/final-report` | `/reviews/final-score` | Config path |
| `/reviewees` | `/reviews/team` | Config path |

---

## App.tsx Integration

```tsx
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

          {/* Protected routes with layout */}
          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/reviews/post-project" element={<PostProjectReviewsPage />} />
            <Route path="/reviews/history" element={<PerformanceHistoryPage />} />
            {/* ...existing routes */}
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}
```

---

## Dashboard Simplification

**Remove from DashboardPage.tsx**:
- Quick Actions section (lines 117-188)
- Status grid with navigation tiles

**Keep**:
- Welcome card with active cycle info
- Profile info card
- Active review cycle details

---

## Accessibility

### ARIA Attributes
```tsx
<nav role="navigation" aria-label="Main navigation">
  <ul role="menu">
    <li role="none">
      <button
        role="menuitem"
        aria-expanded={hasChildren ? isExpanded : undefined}
        aria-current={isActive ? 'page' : undefined}
      >
```

### Keyboard Navigation
- Tab: Move between items
- Enter/Space: Activate item (navigate or expand)
- Focus visible outline on all interactive elements

### Color Contrast
- All text: 4.5:1 minimum ratio
- Active states use --neo-lime with black text

---

## Testing Strategy

### Manual Testing Checklist
- [ ] All 6 top-level items render
- [ ] My Performance submenu expands/collapses
- [ ] All routes navigate correctly
- [ ] Reviewees hidden for non-managers
- [ ] Active state highlights correctly
- [ ] Keyboard navigation works
- [ ] Screen reader announces items

### Unit Tests (Optional)
- AuthContext provides user data
- hasRole() returns correct values
- Navigation config renders all items

---

## Success Criteria

| Criterion | Target |
|-----------|--------|
| Routes navigable | 10/10 |
| TypeScript errors | 0 |
| Role-based visibility | 100% accurate |
| Animation timing | < 300ms |
| WCAG compliance | 2.1 AA |
| Cross-browser | Chrome, Firefox, Safari, Edge |
