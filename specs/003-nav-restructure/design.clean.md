# Navigation & Menu Restructuring - Clean Architecture Design

**Focus**: Proper abstractions, maintainability, extensibility
**Date**: 2025-12-25

---

## Design Philosophy

**Clean Architecture Principles**:
- Clear layer separation (Domain, Application, Presentation)
- Dependency inversion (depend on abstractions)
- Single responsibility for each component
- Open/closed principle (extend via config, not modification)
- Full TypeScript type safety

---

## Layer Separation

```
┌──────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                         │
│  Sidebar, NavigationItem, AuthenticatedLayout                │
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                   ABSTRACTION LAYER                           │
│  INavigationItem, INavigationConfig, UserRole enum           │
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                           │
│  AuthContext, navigation.utils.ts, sessionStorage            │
└──────────────────────────────────────────────────────────────┘
```

---

## Core Types & Interfaces

### navigation.types.ts
```typescript
export enum UserRole {
  USER = 'USER',
  MANAGER = 'MANAGER',
  HR_ADMIN = 'HR_ADMIN',
}

export interface INavigationItem {
  id: string
  label: string
  path?: string
  icon?: React.ComponentType<{ className?: string }>
  children?: INavigationItem[]
  requiredRoles?: UserRole[]
  disabled?: boolean
  badge?: string
}

export interface INavigationConfig {
  items: INavigationItem[]
  defaultExpanded?: string[]
}

export interface IActiveRouteMatch {
  isActive: boolean
  isChildActive: boolean
  expandedPath: string[]
}
```

---

## Component Architecture

### 1. AuthContext (Application Layer)
**File**: `client/src/contexts/AuthContext.tsx`

Provides:
- `user` - Current user object
- `loading` - Loading state
- `hasRole(role)` - Role checking helper
- `hasAnyRole(roles)` - Multi-role checking

### 2. Sidebar (Container Component)
**File**: `client/src/components/navigation/Sidebar.tsx`

Responsibilities:
- Fetch user via `useAuth()`
- Filter items by role
- Manage expansion state
- Render NavigationItem tree

### 3. NavigationItem (Recursive Component)
**File**: `client/src/components/navigation/NavigationItem.tsx`

Responsibilities:
- Render single nav item
- Handle click (navigate or expand)
- Recursively render children
- Apply active state styling
- Provide ARIA attributes

### 4. AuthenticatedLayout (Layout Component)
**File**: `client/src/components/layouts/AuthenticatedLayout.tsx`

Wraps authenticated pages with:
- Navbar (top)
- Sidebar (left)
- Main content area (center)

---

## File Structure

```
client/src/
├── types/
│   └── navigation.types.ts          # Domain types
├── utils/
│   ├── navigation.utils.ts          # Pure functions
│   └── navigation.utils.test.ts     # Unit tests
├── contexts/
│   ├── AuthContext.tsx              # Auth provider
│   └── AuthContext.test.tsx         # Context tests
├── config/
│   └── navigation.config.ts         # Menu configuration
├── components/
│   ├── navigation/
│   │   ├── Sidebar.tsx
│   │   ├── Sidebar.module.css
│   │   ├── Sidebar.test.tsx
│   │   ├── NavigationItem.tsx
│   │   ├── NavigationItem.module.css
│   │   └── NavigationItem.test.tsx
│   └── layouts/
│       ├── AuthenticatedLayout.tsx
│       └── AuthenticatedLayout.module.css
├── pages/
│   ├── ProfilePage.tsx              # NEW
│   ├── ResourcesPage.tsx            # NEW
│   ├── PostProjectReviewsPage.tsx   # NEW
│   ├── PerformanceHistoryPage.tsx   # NEW
│   └── DashboardPage.tsx            # MODIFIED
└── App.tsx                          # MODIFIED
```

---

## Utility Functions

### navigation.utils.ts
```typescript
export function getActiveRouteMatch(
  item: INavigationItem,
  currentPath: string
): IActiveRouteMatch

export function filterItemsByRole(
  items: INavigationItem[],
  hasRole: (role: UserRole) => boolean
): INavigationItem[]

export function getAutoExpandedItems(
  items: INavigationItem[],
  currentPath: string
): Set<string>
```

---

## Key Features

### Extensibility
Add new menu items via config only:
```typescript
// Just add to navigationConfig.ts
{
  id: 'training',
  label: 'Training',
  path: '/training',
  icon: FiBookOpen,
  badge: 'New',
}
```

### Multi-Level Nesting
Recursive design supports arbitrary depth:
```typescript
{
  id: 'reports',
  label: 'Reports',
  children: [
    {
      id: 'quarterly',
      label: 'Quarterly',
      children: [
        { id: 'q1', label: 'Q1 2025', path: '/reports/q1' },
      ],
    },
  ],
}
```

### Full Testability
Pure functions + isolated components:
- Unit tests for utilities
- Component tests with mocked context
- Integration tests for navigation flow

---

## SOLID Compliance

| Principle | Implementation |
|-----------|----------------|
| **SRP** | Each component has single responsibility |
| **OCP** | Extend via config, not modification |
| **LSP** | NavigationItem works for any INavigationItem |
| **ISP** | Minimal, focused interfaces |
| **DIP** | Depends on abstractions (INavigationConfig) |

---

## Pros & Cons

### Pros
- Highly maintainable and extensible
- Full type safety
- Comprehensive testability
- Reusable components
- Clean separation of concerns
- Future-proof architecture

### Cons
- More files and boilerplate
- Longer initial development time (~5-6 hours)
- Slight over-engineering for current scope
- Learning curve for team

---

## Total Impact
- **New files**: 15+
- **New code**: ~1200 lines
- **New dependencies**: react-icons
- **Estimated time**: 5-6 hours
