import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import './Navbar.css'

/**
 * Navbar component
 * Displays application title and user information with logout functionality
 */
const Navbar: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="navbar__brand">
        <h1 className="navbar__title">Evaluation Framework</h1>
      </div>
      <div className="navbar__actions">
        <span className="navbar__user">Welcome, {user?.name}</span>
        <button onClick={handleLogout} className="navbar__logout neo-btn">
          Logout
        </button>
      </div>
    </nav>
  )
}

export default Navbar
