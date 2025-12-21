import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import './DashboardPage.css';

interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
}

const DashboardPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="nav-brand">
          <h1>Performance Evaluation System</h1>
        </div>
        <div className="nav-actions">
          <span className="user-name">Welcome, {user?.name}</span>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="welcome-card">
          <h2>Welcome to Your Dashboard</h2>
          <p>You have successfully logged in!</p>
        </div>

        <div className="info-card">
          <h3>Your Profile</h3>
          <div className="profile-info">
            <div className="info-item">
              <span className="label">Name:</span>
              <span className="value">{user?.name}</span>
            </div>
            <div className="info-item">
              <span className="label">Email:</span>
              <span className="value">{user?.email}</span>
            </div>
            <div className="info-item">
              <span className="label">User ID:</span>
              <span className="value">{user?.id}</span>
            </div>
            <div className="info-item">
              <span className="label">Roles:</span>
              <span className="value">{user?.roles.join(', ')}</span>
            </div>
          </div>
        </div>

        <div className="feature-status">
          <h3>System Status</h3>
          <div className="status-grid">
            <div className="status-item active">
              <div className="status-icon">✓</div>
              <div className="status-text">
                <h4>Authentication</h4>
                <p>Fully operational</p>
              </div>
            </div>
            <div className="status-item pending">
              <div className="status-icon">⏳</div>
              <div className="status-text">
                <h4>Performance Reviews</h4>
                <p>Coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
