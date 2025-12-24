import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import SelfReviewPage from './pages/performance-reviews/SelfReviewPage'
import PeerNominationPage from './pages/performance-reviews/PeerNominationPage'
import PeerFeedbackPage from './pages/performance-reviews/PeerFeedbackPage'
import MyPeerFeedbackPage from './pages/performance-reviews/MyPeerFeedbackPage'
import TeamReviewsPage from './pages/performance-reviews/TeamReviewsPage'
import MyFinalScorePage from './pages/performance-reviews/MyFinalScorePage'
import AdminReviewCyclesPage from './pages/performance-reviews/AdminReviewCyclesPage'
import authService from './services/authService'

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

// Public Route component (redirects to dashboard if already logged in)
const PublicRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated()
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />
}

function App() {
  return (
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
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Performance Review Routes */}
        <Route
          path="/reviews/self-review"
          element={
            <ProtectedRoute>
              <SelfReviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reviews/peer-nomination"
          element={
            <ProtectedRoute>
              <PeerNominationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reviews/peer-feedback"
          element={
            <ProtectedRoute>
              <PeerFeedbackPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reviews/my-peer-feedback"
          element={
            <ProtectedRoute>
              <MyPeerFeedbackPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reviews/team"
          element={
            <ProtectedRoute>
              <TeamReviewsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reviews/final-score"
          element={
            <ProtectedRoute>
              <MyFinalScorePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reviews/admin/cycles"
          element={
            <ProtectedRoute>
              <AdminReviewCyclesPage />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  )
}

export default App
