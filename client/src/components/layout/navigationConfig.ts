import { FiUser, FiBarChart2, FiRefreshCw, FiFileText, FiUsers, FiBookOpen } from 'react-icons/fi'
import { IconType } from 'react-icons'

/**
 * Navigation item interface defining the structure of menu items.
 *
 * @interface NavItem
 * @property {string} id - Unique identifier for the navigation item (used for expansion state)
 * @property {string} label - Display text shown in the sidebar
 * @property {string} [path] - Route path for navigation (optional for parent-only items)
 * @property {IconType} icon - React-icons component to display
 * @property {NavItem[]} [children] - Nested menu items for expandable submenus
 * @property {string[]} [roles] - Array of roles that can see this item (if omitted, visible to all)
 *
 * @example
 * ```ts
 * // Simple navigation item
 * const item: NavItem = {
 *   id: 'profile',
 *   label: 'Profile',
 *   path: '/profile',
 *   icon: FiUser,
 * }
 *
 * // Role-restricted item (only visible to MANAGER and HR_ADMIN)
 * const restrictedItem: NavItem = {
 *   id: 'team',
 *   label: 'Team Reviews',
 *   path: '/reviews/team',
 *   icon: FiUsers,
 *   roles: ['MANAGER', 'HR_ADMIN'],
 * }
 *
 * // Parent item with children (expandable submenu)
 * const parentItem: NavItem = {
 *   id: 'my-performance',
 *   label: 'My Performance',
 *   icon: FiBarChart2,
 *   children: [
 *     { id: 'overview', label: 'Overview', path: '/dashboard', icon: FiBarChart2 },
 *     { id: 'history', label: 'History', path: '/reviews/history', icon: FiFileText },
 *   ],
 * }
 * ```
 */
export interface NavItem {
  id: string
  label: string
  path?: string
  icon: IconType
  children?: NavItem[]
  roles?: string[]
}

/**
 * Navigation configuration array defining the sidebar menu structure.
 *
 * This is the main configuration for the application's sidebar navigation.
 * The order of items in this array determines their display order in the sidebar.
 *
 * ## Current Menu Structure
 *
 * 1. **Employee Profile** - User profile page (`/profile`)
 * 2. **My Performance** - Expandable submenu containing:
 *    - Overview (`/dashboard`)
 *    - 360 Review (`/reviews/peer-feedback`)
 *    - Final Report (`/reviews/final-score`)
 *    - Post Project (`/reviews/post-project`)
 *    - History (`/reviews/history`)
 * 3. **360 Review** - Direct link to peer feedback (`/reviews/peer-feedback`)
 * 4. **Post Project Reviews** - Direct link to post-project reviews (`/reviews/post-project`)
 * 5. **Reviewees** - Team reviews, restricted to MANAGER and HR_ADMIN roles (`/reviews/team`)
 * 6. **Resources** - General resources page (`/resources`)
 *
 * ## Adding New Menu Items
 *
 * To add a new top-level menu item:
 * ```ts
 * {
 *   id: 'unique-id',           // Must be unique across all items
 *   label: 'Display Label',    // Text shown in the sidebar
 *   path: '/route-path',       // Route to navigate to
 *   icon: FiIconName,          // Import from react-icons/fi
 *   roles: ['ROLE1', 'ROLE2'], // Optional: restrict visibility by role
 * }
 * ```
 *
 * To add a submenu, include a `children` array instead of a `path`:
 * ```ts
 * {
 *   id: 'parent-id',
 *   label: 'Parent Menu',
 *   icon: FiFolder,
 *   children: [
 *     { id: 'child-1', label: 'Child 1', path: '/child-1', icon: FiFile },
 *     { id: 'child-2', label: 'Child 2', path: '/child-2', icon: FiFile },
 *   ],
 * }
 * ```
 *
 * ## Role-Based Visibility
 *
 * Items with a `roles` array are only visible to users with at least one matching role.
 * Items without a `roles` array are visible to all authenticated users.
 *
 * Available roles (defined in the backend):
 * - `USER` - Standard user role
 * - `MANAGER` - Manager with team oversight
 * - `HR_ADMIN` - HR administrator with full access
 */
export const navigationConfig: NavItem[] = [
  {
    id: 'employee-profile',
    label: 'Employee Profile',
    path: '/profile',
    icon: FiUser,
  },
  {
    id: 'my-performance',
    label: 'My Performance',
    icon: FiBarChart2,
    children: [
      {
        id: 'overview',
        label: 'Overview',
        path: '/dashboard',
        icon: FiBarChart2,
      },
      {
        id: 'self-review',
        label: 'Self Review',
        path: '/reviews/self-review',
        icon: FiUser,
      },
      {
        id: 'peer-nomination',
        label: 'Peer Nomination',
        path: '/reviews/peer-nomination',
        icon: FiUsers,
      },
      {
        id: '360-review-sub',
        label: '360 Review',
        path: '/reviews/peer-feedback',
        icon: FiRefreshCw,
      },
      {
        id: 'final-report',
        label: 'Final Report',
        path: '/reviews/final-score',
        icon: FiBarChart2,
      },
      {
        id: 'post-project-sub',
        label: 'Post Project',
        path: '/reviews/post-project',
        icon: FiFileText,
      },
      {
        id: 'history',
        label: 'History',
        path: '/reviews/history',
        icon: FiFileText,
      },
    ],
  },
  {
    id: '360-review',
    label: '360 Review',
    path: '/reviews/peer-feedback',
    icon: FiRefreshCw,
  },
  {
    id: 'post-project',
    label: 'Post Project Reviews',
    path: '/reviews/post-project',
    icon: FiFileText,
  },
  {
    id: 'reviewees',
    label: 'Reviewees',
    path: '/reviews/team',
    icon: FiUsers,
    roles: ['MANAGER', 'HR_ADMIN'],
  },
  {
    id: 'resources',
    label: 'Resources',
    path: '/resources',
    icon: FiBookOpen,
  },
]
