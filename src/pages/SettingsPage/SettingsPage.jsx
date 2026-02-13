import React from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../../services/authService';
import { clearUser } from '../../store/slices/authSlice';
import { useDispatch } from 'react-redux';
import '../Pages.css';

function SettingsPage({ user }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = async () => {
    await logoutUser();
    dispatch(clearUser());
    navigate('/login');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Settings</h1>
      </div>
      <div className="page-content">
        <div className="settings-section">
          <h2>Account Information</h2>
          <p><strong>Name:</strong> {user?.displayName || 'Not set'}</p>
          <p><strong>Email:</strong> {user?.email || 'Not set'}</p>
        </div>
        <div className="settings-section">
          <h2>Account Actions</h2>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
