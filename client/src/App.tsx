import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import MainLayout from './components/layout/MainLayout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import ResourcesPage from './pages/ResourcesPage'
import PostProjectReviewsPage from './pages/PostProjectReviewsPage'
import PerformanceHistoryPage from './pages/PerformanceHistoryPage'
import SelfReviewPage from './pages/performance-reviews/SelfReviewPage'
import PeerNominationPage from './pages/performance-reviews/PeerNominationPage'
import PeerFeedbackPage from './pages/performance-reviews/PeerFeedbackPage'
import MyPeerFeedbackPage from './pages/performance-reviews/MyPeerFeedbackPage'
import TeamReviewsPage from './pages/performance-reviews/TeamReviewsPage'
import ManagerEmployeeReviewPage from './pages/performance-reviews/ManagerEmployeeReviewPage'
import MyFinalScorePage from './pages/performance-reviews/MyFinalScorePage'
import CalibrationDashboardPage from './pages/performance-reviews/CalibrationDashboardPage'
import AdminReviewCyclesPage from './pages/performance-reviews/AdminReviewCyclesPage'
import { useAuth } from './contexts/AuthContext'

// Protected Route component - uses AuthContext to handle loading state properly
const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="loading-screen">Loading...</div>
  }

  return user ? children : <Navigate to="/login" replace />
}

// Role-Protected Route component - requires specific roles to access
interface RoleProtectedRouteProps {
  children: React.ReactElement
  allowedRoles: string[]
}

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading, hasRole } = useAuth()

  if (loading) {
    return <div className="loading-screen">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const hasRequiredRole = allowedRoles.some((role) => hasRole(role))

  if (!hasRequiredRole) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

// Public Route component (redirects to dashboard if already logged in)
const PublicRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="loading-screen">Loading...</div>
  }

  return !user ? children : <Navigate to="/dashboard" replace />
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />

          {/* Protected routes with MainLayout */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/resources" element={<ResourcesPage />} />

            {/* Performance Review Routes */}
            <Route path="/reviews/self-review" element={<SelfReviewPage />} />
            <Route path="/reviews/peer-nomination" element={<PeerNominationPage />} />
            <Route path="/reviews/peer-feedback" element={<PeerFeedbackPage />} />
            <Route path="/reviews/my-peer-feedback" element={<MyPeerFeedbackPage />} />
            <Route
              path="/reviews/team"
              element={
                <RoleProtectedRoute allowedRoles={['MANAGER', 'HR_ADMIN']}>
                  <TeamReviewsPage />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/reviews/manager/employee/:employeeId"
              element={
                <RoleProtectedRoute allowedRoles={['MANAGER', 'HR_ADMIN']}>
                  <ManagerEmployeeReviewPage />
                </RoleProtectedRoute>
              }
            />
            <Route path="/reviews/final-score" element={<MyFinalScorePage />} />
            <Route
              path="/reviews/calibration"
              element={
                <RoleProtectedRoute allowedRoles={['HR_ADMIN']}>
                  <CalibrationDashboardPage />
                </RoleProtectedRoute>
              }
            />
            <Route
              path="/reviews/admin/cycles"
              element={
                <RoleProtectedRoute allowedRoles={['HR_ADMIN']}>
                  <AdminReviewCyclesPage />
                </RoleProtectedRoute>
              }
            />
            <Route path="/reviews/post-project" element={<PostProjectReviewsPage />} />
            <Route path="/reviews/history" element={<PerformanceHistoryPage />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
