import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { navigationConfig, NavItem } from './navigationConfig'
import NavigationItem from './NavigationItem'
import './Sidebar.css'

/** Session storage key for persisting navigation expansion state */
const STORAGE_KEY = 'nav_expanded'

/**
 * Sidebar navigation component.
 *
 * Displays the main application navigation menu with the following features:
 * - Role-based filtering: Menu items with a `roles` array are only visible to users with matching roles
 * - Expandable submenus: Items with children can be expanded/collapsed
 * - Persistence: Expansion state is saved to sessionStorage and restored on page refresh
 * - Auto-expansion: Parent items automatically expand when a child route is active
 * - Active state highlighting: The current route's menu item is visually highlighted
 *
 * The sidebar implements WCAG 2.1 AA accessibility requirements with proper ARIA roles
 * and keyboard navigation support.
 *
 * @component
 *
 * @example
 * ```tsx
 * // Used within MainLayout
 * <div className="layout">
 *   <Sidebar />
 *   <main>
 *     <Outlet />
 *   </main>
 * </div>
 * ```
 */
const Sidebar: React.FC = () => {
  const { hasRole } = useAuth()
  const location = useLocation()

  /**
   * Set of expanded navigation item IDs.
   * Initialized from sessionStorage or defaults to 'my-performance' expanded.
   */
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        return new Set(JSON.parse(stored))
      } catch {
        return new Set(['my-performance'])
      }
    }
    return new Set(['my-performance'])
  })

  // Save expansion state to sessionStorage when it changes
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(expanded)))
  }, [expanded])

  // Auto-expand parent when child route is active
  useEffect(() => {
    const currentPath = location.pathname
    navigationConfig.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some((child) => child.path === currentPath)
        if (hasActiveChild && !expanded.has(item.id)) {
          setExpanded((prev) => {
            const newSet = new Set(Array.from(prev))
            newSet.add(item.id)
            return newSet
          })
        }
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  /**
   * Filter navigation items based on user roles.
   *
   * Items without a `roles` array are visible to all authenticated users.
   * Items with a `roles` array are only visible if the user has at least one
   * of the specified roles.
   *
   * @param {NavItem[]} items - Array of navigation items to filter
   * @returns {NavItem[]} Filtered array of navigation items visible to the current user
   *
   * @example
   * ```ts
   * // Item visible only to managers and HR admins:
   * { id: 'reviewees', roles: ['MANAGER', 'HR_ADMIN'], ... }
   *
   * // Item visible to all users (no roles array):
   * { id: 'profile', label: 'Profile', ... }
   * ```
   */
  const filterByRole = (items: NavItem[]): NavItem[] => {
    return items.filter((item) => {
      if (!item.roles) return true
      return item.roles.some((role) => hasRole(role))
    })
  }

  /**
   * Toggle the expansion state of a navigation item.
   *
   * @param {string} id - The unique identifier of the navigation item to toggle
   */
  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  /**
   * Check if a navigation path is currently active.
   *
   * @param {string} [path] - The path to check against the current location
   * @returns {boolean} True if the path matches the current location pathname
   */
  const isActive = (path?: string): boolean => {
    if (!path) return false
    return location.pathname === path
  }

  const filteredItems = filterByRole(navigationConfig)

  return (
    <aside className="sidebar">
      <nav className="sidebar__nav" role="navigation" aria-label="Main navigation">
        <ul className="nav-menu" role="menu">
          {filteredItems.map((item) => (
            <li key={item.id} role="none">
              <NavigationItem
                item={item}
                isExpanded={expanded.has(item.id)}
                isActive={isActive}
                onToggle={toggleExpand}
              />
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar
