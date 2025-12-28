# Navigation & Menu Restructuring - Minimal Change Design

**Focus**: Smallest possible change, maximum reuse of existing patterns
**Date**: 2025-12-25

---

## Design Philosophy

**Minimal Changes - Maximum Reuse**:
- Only 510 lines of new code across 10 files
- Zero new dependencies (uses existing React Router)
- Maximum pattern reuse from DashboardPage.tsx
- Simple prop drilling instead of Context API
- Redirects over new pages where possible

---

## Architecture Overview

### New Components (2)
- `Sidebar.tsx` (~120 lines) - Main navigation component
- `MainLayout.tsx` (~20 lines) - Layout wrapper

### Configuration (1)
- `navigationConfig.ts` (~80 lines) - Menu structure with emojis

### Placeholder Pages (4)
- ProfilePage, ResourcesPage, PostProjectReviewsPage, PerformanceHistoryPage

### Modified Files (3)
- `App.tsx` - Add user state, routes, layout wrapper
- `DashboardPage.tsx` - Remove Quick Actions, accept user prop
- `DashboardPage.css` - Adjust for sidebar layout

---

## Key Design Decisions

| Decision | Approach | Rationale |
|----------|----------|-----------|
| **Icons** | Emojis (no library) | Matches existing DashboardPage |
| **User State** | Prop drilling (App → MainLayout → Sidebar) | Only 2 levels deep |
| **Navigation Config** | Inline TypeScript object | Only 10 items needed |
| **Submenu State** | useState + sessionStorage | Simple persistence |
| **Styling** | Existing CSS variables | 100% pattern reuse |

---

## Pattern Reuse from Existing Code

### 1. Role-Based Visibility
**From**: `DashboardPage.tsx:49`
```typescript
const hasRole = (role: string) => user?.roles.includes(role)
```

### 2. User Fetching
**From**: `DashboardPage.tsx:21-42`
```typescript
useEffect(() => {
  const fetchData = async () => {
    const userData = await authService.getCurrentUser()
    setUser(userData)
  }
  fetchData()
}, [navigate])
```

### 3. Navigation
**From**: `DashboardPage.tsx:120`
```typescript
onClick={() => navigate('/reviews/self-review')}
```

### 4. CSS Hover/Active
**From**: `DashboardPage.css`
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

---

## File Structure

```
client/src/
├── components/
│   └── layout/
│       ├── MainLayout.tsx       # NEW
│       ├── MainLayout.css       # NEW
│       ├── Sidebar.tsx          # NEW
│       └── Sidebar.css          # NEW
├── config/
│   └── navigationConfig.ts      # NEW
├── pages/
│   ├── ProfilePage.tsx          # NEW (placeholder)
│   ├── ResourcesPage.tsx        # NEW (placeholder)
│   ├── PostProjectReviewsPage.tsx # NEW (placeholder)
│   ├── PerformanceHistoryPage.tsx # NEW (placeholder)
│   └── DashboardPage.tsx        # MODIFIED
└── App.tsx                      # MODIFIED
```

---

## Implementation

### User State Management (App.tsx)
```typescript
const [user, setUser] = useState<User | null>(null)

useEffect(() => {
  if (authService.isAuthenticated()) {
    authService.getCurrentUser().then(setUser)
  }
}, [])

// Pass to MainLayout → Sidebar
<MainLayout user={user}>
  <DashboardPage user={user} />
</MainLayout>
```

### Submenu Persistence (Sidebar.tsx)
```typescript
const [isExpanded, setIsExpanded] = useState(() => {
  return sessionStorage.getItem('myPerformanceExpanded') !== 'false'
})

const toggle = () => {
  setIsExpanded(prev => {
    sessionStorage.setItem('myPerformanceExpanded', String(!prev))
    return !prev
  })
}
```

### Active State Detection
```typescript
const location = useLocation()

const isActive = (path: string) => {
  return location.pathname === path ||
    (path === '/reviews' && location.pathname.startsWith('/reviews/'))
}
```

---

## Route Strategy

**New Placeholder Pages**:
- `/profile` → ProfilePage
- `/resources` → ResourcesPage
- `/reviews/post-project` → PostProjectReviewsPage
- `/reviews/history` → PerformanceHistoryPage

**Redirects to Existing**:
- `/reviews/overview` → `/dashboard`
- `/reviews/360` → `/reviews/peer-feedback`
- `/reviews/final-report` → `/reviews/final-score`
- `/reviewees` → `/reviews/team`

---

## Pros & Cons

### Pros
- Fastest to implement (~2-3 hours)
- Zero learning curve (reuses existing patterns)
- No new dependencies
- Minimal risk of breaking changes

### Cons
- Prop drilling may become unwieldy if more components need user
- Emojis instead of proper icons
- Limited extensibility
- No dedicated type system for navigation

---

## Total Impact
- **New code**: ~510 lines
- **Modified files**: 3
- **New dependencies**: 0
- **Estimated time**: 2-3 hours
