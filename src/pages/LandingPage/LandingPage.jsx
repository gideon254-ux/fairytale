import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { signInWithEmail, signUpWithEmail } from '../../services/authService';
import { setUser } from '../../store/slices/authSlice';
import './LandingPage.css';

function LandingPage() {
  const [activeTab, setActiveTab] = useState('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await signInWithEmail(formData.email, formData.password);
      dispatch(setUser({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
      }));
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    try {
      const user = await signUpWithEmail(formData.email, formData.password, formData.displayName);
      dispatch(setUser({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
      }));
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-container">
      <div className="landing-background">
        <div className="landing-shape shape-1"></div>
        <div className="landing-shape shape-2"></div>
        <div className="landing-shape shape-3"></div>
      </div>

      <div className="landing-content">
        <div className="landing-header">
            <div className="landing-logo">
            <div className="logo-icon"></div>
            <span className="logo-text">Fairytale</span>
          </div>
          <p className="landing-tagline">Turn your dreams into reality, one task at a time.</p>
        </div>

        <div className="auth-card">
          <div className="auth-tabs">
            <button
              className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => setActiveTab('login')}
            >
              Sign In
            </button>
            <button
              className={`auth-tab ${activeTab === 'signup' ? 'active' : ''}`}
              onClick={() => setActiveTab('signup')}
            >
              Create Account
            </button>
          </div>

          {error && <div className="auth-error">{error}</div>}

          {activeTab === 'login' ? (
            <form className="auth-form" onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                />
              </div>
              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
              <p className="auth-switch">
                Don't have an account?{' '}
                <button type="button" onClick={() => setActiveTab('signup')}>
                  Create one
                </button>
              </p>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleSignup}>
              <div className="form-group">
                <label htmlFor="displayName">Full Name</label>
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="signup-email">Email Address</label>
                <input
                  type="email"
                  id="signup-email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="signup-password">Password</label>
                <input
                  type="password"
                  id="signup-password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password (min 6 characters)"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  required
                />
              </div>
              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
              <p className="auth-switch">
                Already have an account?{' '}
                <button type="button" onClick={() => setActiveTab('login')}>
                  Sign in
                </button>
              </p>
            </form>
          )}
        </div>

        <div className="landing-features">
          <div className="feature-item">
            <div className="feature-icon"></div>
            <h3>Project Management</h3>
            <p>Create and organize all your projects in one place</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon"></div>
            <h3>Task Tracking</h3>
            <p>Track tasks with deadlines and completion status</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon"></div>
            <h3>Progress Analytics</h3>
            <p>Visualize your progress with real-time statistics</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
