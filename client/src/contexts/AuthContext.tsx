import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import authService from '../services/authService'

/**
 * Represents an authenticated user in the system.
 *
 * @interface User
 * @property {string} id - Unique identifier for the user
 * @property {string} email - User's email address
 * @property {string} name - User's display name
 * @property {string[]} roles - Array of role strings (e.g., 'USER', 'MANAGER', 'HR_ADMIN')
 */
export interface User {
  id: string
  email: string
  name: string
  roles: string[]
}

/**
 * Authentication context value providing user state and helper functions.
 *
 * @interface AuthContextValue
 * @property {User | null} user - The currently authenticated user, or null if not authenticated
 * @property {boolean} loading - Whether authentication state is being loaded
 * @property {function} hasRole - Function to check if the current user has a specific role
 * @property {function} logout - Function to log out the current user and clear auth state
 */
export interface AuthContextValue {
  user: User | null
  loading: boolean
  hasRole: (role: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

/**
 * Authentication Provider component that manages global authentication state.
 *
 * This provider wraps the application and provides authentication context to all
 * child components. It fetches the current user on mount using the authService
 * and maintains the user state throughout the application lifecycle.
 *
 * @component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to wrap with auth context
 *
 * @example
 * ```tsx
 * // Wrap your app with AuthProvider in App.tsx
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * ```
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (authService.isAuthenticated()) {
          const userData = await authService.getCurrentUser()
          setUser(userData)
        }
      } catch (error) {
        console.error('Failed to fetch user:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  /**
   * Check if the current user has a specific role.
   *
   * @param {string} role - The role to check for (e.g., 'MANAGER', 'HR_ADMIN')
   * @returns {boolean} True if the user has the specified role, false otherwise
   */
  const hasRole = useCallback(
    (role: string): boolean => {
      if (!user) return false
      return user.roles.includes(role)
    },
    [user]
  )

  /**
   * Log out the current user and clear authentication state.
   * Clears tokens from storage and resets user state to null.
   */
  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
  }, [])

  const value: AuthContextValue = {
    user,
    loading,
    hasRole,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Custom hook to access authentication context.
 *
 * Provides access to the current user, loading state, and role-checking helper.
 * Must be used within a component that is wrapped by AuthProvider.
 *
 * @returns {AuthContextValue} The authentication context value
 * @throws {Error} Throws an error if used outside of AuthProvider
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const { user, loading, hasRole } = useAuth()
 *
 *   if (loading) return <Loading />
 *   if (!user) return <LoginPrompt />
 *
 *   // Check if user has manager role
 *   if (hasRole('MANAGER')) {
 *     return <ManagerDashboard />
 *   }
 *
 *   return <UserDashboard user={user} />
 * }
 * ```
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
