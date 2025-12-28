import React from 'react'
import { useNavigate } from 'react-router-dom'
import { FiChevronDown, FiChevronRight } from 'react-icons/fi'
import { NavItem } from './navigationConfig'

/**
 * Props for the NavigationItem component.
 *
 * @interface NavigationItemProps
 * @property {NavItem} item - The navigation item configuration to render
 * @property {boolean} [isExpanded=false] - Whether the item's submenu is expanded (for items with children)
 * @property {function} [isActive] - Function to check if a path is currently active
 * @property {function} [onToggle] - Callback to toggle expansion state (called with item id)
 * @property {number} [level=0] - Nesting level for indentation (0 = top-level, 1+ = nested)
 */
export interface NavigationItemProps {
  item: NavItem
  isExpanded?: boolean
  isActive?: (path?: string) => boolean
  onToggle?: (id: string) => void
  level?: number
}

/**
 * Navigation menu item component with support for nested submenus.
 *
 * This component renders a single navigation item with the following features:
 * - Icon display using react-icons
 * - Click handling for navigation or submenu expansion
 * - Active state styling for the current route
 * - Chevron indicator for expandable items
 * - Recursive rendering for nested menu items (submenus)
 *
 * The component handles two types of items:
 * 1. **Navigable items**: Items with a `path` property navigate to that route on click
 * 2. **Expandable items**: Items with `children` toggle submenu expansion on click
 *
 * Accessibility features:
 * - `role="menuitem"` for proper menu semantics
 * - `aria-expanded` for expandable items
 * - `aria-current="page"` for active items
 *
 * @component
 *
 * @example
 * ```tsx
 * // Basic usage for a simple navigation item
 * <NavigationItem
 *   item={{ id: 'profile', label: 'Profile', path: '/profile', icon: FiUser }}
 *   isActive={(path) => path === currentPath}
 * />
 *
 * // Usage with expandable submenu
 * <NavigationItem
 *   item={{
 *     id: 'my-performance',
 *     label: 'My Performance',
 *     icon: FiBarChart2,
 *     children: [
 *       { id: 'overview', label: 'Overview', path: '/dashboard', icon: FiBarChart2 },
 *       { id: 'history', label: 'History', path: '/reviews/history', icon: FiFileText },
 *     ]
 *   }}
 *   isExpanded={true}
 *   isActive={(path) => path === currentPath}
 *   onToggle={(id) => toggleExpanded(id)}
 * />
 * ```
 */
const NavigationItem: React.FC<NavigationItemProps> = ({
  item,
  isExpanded = false,
  isActive = () => false,
  onToggle,
  level = 0,
}) => {
  const navigate = useNavigate()
  const hasChildren = item.children && item.children.length > 0
  const active = isActive(item.path)

  /**
   * Handle click on the navigation item.
   *
   * For items with a path: navigates to that route.
   * For items with children but no path: toggles submenu expansion.
   */
  const handleClick = () => {
    // If item has a path, navigate to it
    if (item.path) {
      navigate(item.path)
    }
    // If item has children, toggle expansion
    else if (hasChildren && onToggle) {
      onToggle(item.id)
    }
  }

  const itemClassName = [
    'nav-item',
    level > 0 ? 'nav-item--child' : '',
    active ? 'nav-item--active' : '',
    hasChildren ? 'nav-item--expandable' : '',
  ]
    .filter(Boolean)
    .join(' ')

  // Render content wrapped appropriately based on level
  // Top-level items have their <li> wrapper in Sidebar.tsx
  // Child items need their own <li> wrapper with role="none"
  const buttonElement = (
    <button
      className={itemClassName}
      onClick={handleClick}
      type="button"
      role="menuitem"
      aria-expanded={hasChildren ? isExpanded : undefined}
      aria-current={active ? 'page' : undefined}
    >
      <span className="nav-item__icon">
        {item.icon({ size: 20 })}
      </span>
      <span className="nav-item__label">{item.label}</span>
      {hasChildren && (
        <span className="nav-item__chevron">
          {isExpanded ? FiChevronDown({ size: 16 }) : FiChevronRight({ size: 16 })}
        </span>
      )}
    </button>
  )

  /**
   * Render submenu items recursively.
   * Only rendered when the item has children and is expanded.
   */
  const submenuElement = hasChildren && isExpanded && (
    <ul className="nav-submenu" role="menu">
      {item.children?.map((child) => (
        <li key={child.id} role="none">
          <NavigationItem
            item={child}
            isActive={isActive}
            level={level + 1}
          />
        </li>
      ))}
    </ul>
  )

  // Top-level items (level 0) don't need their own li wrapper - it's in Sidebar.tsx
  if (level === 0) {
    return (
      <>
        {buttonElement}
        {submenuElement}
      </>
    )
  }

  // Child items need their own content only (li wrapper is provided by parent)
  return (
    <>
      {buttonElement}
      {submenuElement}
    </>
  )
}

export default NavigationItem
