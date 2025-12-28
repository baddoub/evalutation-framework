# Navigation & Menu Restructuring - Pragmatic Design

**Focus**: Right balance of speed + quality
**Date**: 2025-12-25

---

## Design Philosophy

**Pragmatic Balance**:
- Appropriate abstraction for feature size
- Fast to implement while maintainable
- Type-safe but not over-engineered
- Context API without full clean architecture
- React Icons for proper icons (small investment, big payoff)

---

## Architecture Overview

### Component Hierarchy
```
App.tsx
└── AuthProvider (Context)
    └── Router
        └── AuthenticatedLayout
            ├── Navbar
            ├── Sidebar
            │   └── NavigationItem (recursive)
            └── Main Content (Outlet)
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **State Management** | AuthContext | Shared user state, no Redux overhead |
| **Icons** | React Icons (Feather) | Professional look, tree-shakeable |
| **Types** | Interface + inline types | Enough for maintainability |
| **Styling** | Regular CSS files | Matches existing patterns |
| **Testing** | Manual + key unit tests | Pragmatic coverage |

---

## File Structure

```
client/src/
├── contexts/
│   └── AuthContext.tsx              # NEW - Shared user state
├── components/
│   └── layout/
│       ├── MainLayout.tsx           # NEW - Navbar + Sidebar wrapper
│       ├── MainLayout.css           # NEW
│       ├── Navbar.tsx               # NEW - Extracted from Dashboard
│       ├── Navbar.css               # NEW
│       ├── Sidebar.tsx              # NEW - Main navigation
│       ├── Sidebar.css              # NEW
│       ├── NavigationItem.tsx       # NEW - Single nav item
│       └── navigationConfig.ts      # NEW - Menu structure
├── pages/
│   ├── ProfilePage.tsx              # NEW (placeholder)
│   ├── ResourcesPage.tsx            # NEW (placeholder)
│   ├── PostProjectReviewsPage.tsx   # NEW (placeholder)
│   ├── PerformanceHistoryPage.tsx   # NEW (placeholder)
│   └── DashboardPage.tsx            # MODIFIED
└── App.tsx                          # MODIFIED
```

**Total**: 12 new files, 2 modified

---

## AuthContext Implementation

```typescript
// contexts/AuthContext.tsx
interface AuthContextValue {
  user: User | null
  loading: boolean
  hasRole: (role: string) => boolean
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authService.isAuthenticated()) {
      authService.getCurrentUser()
        .then(setUser)
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const hasRole = useCallback(
    (role: string) => user?.roles.includes(role) ?? false,
    [user]
  )

  return (
    <AuthContext.Provider value={{ user, loading, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
```

---

## Navigation Configuration

```typescript
// components/layout/navigationConfig.ts
import { FiUser, FiBarChart2, FiRefreshCw, FiFileText, FiUsers, FiBookOpen } from 'react-icons/fi'

export interface NavItem {
  id: string
  label: string
  path?: string
  icon: React.ComponentType<{ className?: string }>
  children?: NavItem[]
  roles?: string[]
}

export const navigationConfig: NavItem[] = [
  { id: 'profile', label: 'Employee Profile', path: '/profile', icon: FiUser },
  {
    id: 'my-performance',
    label: 'My Performance',
    icon: FiBarChart2,
    children: [
      { id: 'overview', label: 'Overview', path: '/dashboard', icon: FiBarChart2 },
      { id: '360-sub', label: '360 Review', path: '/reviews/peer-feedback', icon: FiRefreshCw },
      { id: 'final-report', label: 'Final Report', path: '/reviews/final-score', icon: FiFileText },
      { id: 'post-project-sub', label: 'Post Project', path: '/reviews/post-project', icon: FiFileText },
      { id: 'history', label: 'History', path: '/reviews/history', icon: FiFileText },
    ],
  },
  { id: '360-top', label: '360 Review', path: '/reviews/peer-feedback', icon: FiRefreshCw },
  { id: 'post-project-top', label: 'Post Project Reviews', path: '/reviews/post-project', icon: FiFileText },
  { id: 'reviewees', label: 'Reviewees', path: '/reviews/team', icon: FiUsers, roles: ['MANAGER', 'HR_ADMIN'] },
  { id: 'resources', label: 'Resources', path: '/resources', icon: FiBookOpen },
]
```

---

## Sidebar Component

```typescript
// components/layout/Sidebar.tsx
export const Sidebar: React.FC = () => {
  const { hasRole } = useAuth()
  const location = useLocation()
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['my-performance']))

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const isActive = (path?: string) => path === location.pathname

  const filterByRole = (items: NavItem[]) =>
    items.filter(item => !item.roles || item.roles.some(hasRole))

  return (
    <nav className="sidebar" role="navigation">
      <ul className="sidebar__list">
        {filterByRole(navigationConfig).map(item => (
          <NavigationItem
            key={item.id}
            item={item}
            isExpanded={expanded.has(item.id)}
            isActive={isActive}
            onToggle={toggleExpand}
          />
        ))}
      </ul>
    </nav>
  )
}
```

---

## Implementation Timeline

| Phase | Tasks | Time |
|-------|-------|------|
| **1. Foundation** | AuthContext, install react-icons | 30 min |
| **2. Core Components** | Sidebar, NavigationItem, Navbar, MainLayout | 1.5 hrs |
| **3. Integration** | App.tsx routes, DashboardPage, placeholders | 1 hr |
| **4. Testing** | Manual testing, accessibility audit | 45 min |

**Total**: 4-5 hours

---

## CSS Styling (Neobrutalism)

```css
/* Sidebar.css */
.sidebar {
  width: 260px;
  min-width: 260px;
  background: var(--neo-white);
  border-right: var(--neo-border-thick);
  height: calc(100vh - 72px);
  position: sticky;
  top: 72px;
  overflow-y: auto;
  padding: var(--neo-space-4) 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--neo-space-3);
  padding: var(--neo-space-3) var(--neo-space-6);
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all var(--neo-transition-fast);
  font-weight: var(--neo-font-medium);
  width: 100%;
  text-align: left;
  border-left: 4px solid transparent;
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
  padding-left: calc(var(--neo-space-6) + var(--neo-space-6));
  font-size: var(--neo-text-sm);
  background: var(--neo-gray-100);
}
```

---

## Trade-offs Accepted

### Accepting (for speed)
- Simple type system (no full domain model)
- Manual role filtering (no utility abstraction)
- Minimal unit tests (rely on manual testing)
- Desktop-only (no mobile sidebar)

### Maintaining (for quality)
- TypeScript strict mode
- WCAG 2.1 AA accessibility
- Neobrutalism design consistency
- Context for shared state
- Config-driven navigation

---

## Pros & Cons

### Pros
- Good balance of speed and quality
- Proper icons (professional look)
- Shared auth state (no prop drilling)
- Easy to extend via config
- Reasonable test coverage

### Cons
- Not as extensible as clean architecture
- Some duplication in types
- Manual testing heavier than ideal

---

## Total Impact
- **New files**: 12
- **New code**: ~800 lines
- **New dependencies**: react-icons
- **Estimated time**: 4-5 hours
