import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import './MainLayout.css'

/**
 * MainLayout component
 * Provides the main application layout with navbar, sidebar, and content area
 * Uses React Router's Outlet for nested route rendering
 */
const MainLayout: React.FC = () => {
  return (
    <div className="main-layout">
      <Navbar />
      <div className="main-layout__body">
        <Sidebar />
        <main className="main-layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default MainLayout
