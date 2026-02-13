import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getAllUserProjects } from '../../services/projectService';
import { setProjects, setLoading } from '../../store/slices/projectSlice';
import { fetchUserStats } from '../../store/slices/userStatsSlice';
import { logoutUser } from '../../services/authService';
import { clearUser } from '../../store/slices/authSlice';
import RewardsDisplay from '../../components/RewardsDisplay';
import FestiveBanner from '../../components/FestiveBanner';
import ProjectCountdown from '../../components/ProjectCountdown';
import './DashboardPage.css';

const ProjectCard = ({ project, viewMode, onClick }) => {
  return (
    <div
      className={`project-card project-card-${viewMode}`}
      onClick={onClick}
    >
      <div className="project-header">
        <h3>{project.name}</h3>
        <span className={`status-badge status-${project.status}`}>
          {project.status}
        </span>
      </div>
      <p className="project-description">
        {project.description || 'No description'}
      </p>
      {project.dueDate && (
        <ProjectCountdown dueDate={project.dueDate} size="small" />
      )}
      <div className="project-footer">
        <span>{project.taskCount || 0} tasks</span>
        <span>{project.teamMembers?.length || 1} members</span>
        {project.priority && (
          <span className={`priority-badge priority-${project.priority}`}>
            {project.priority}
          </span>
        )}
      </div>
      {project.progress !== undefined && (
        <div className="project-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${project.progress}%` }}
            ></div>
          </div>
          <span className="progress-text">{project.progress}%</span>
        </div>
      )}
    </div>
  );
};

function DashboardPage({ user }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { projects, loading } = useSelector(state => state.projects);
  const { totalXP, currentLevel, currentStreak } = useSelector(state => state.userStats);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
  });
  const [groupBy, setGroupBy] = useState('status');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('grid');
  const [theme, setTheme] = useState('light');
  const [showWidgets, setShowWidgets] = useState({
    stats: true,
    rewards: true,
    quickActions: true,
    recentActivity: true
  });
  const [showCustomization, setShowCustomization] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    search: '',
    dateRange: ''
  });

  useEffect(() => {
    fetchProjects();
    if (user?.uid) {
      dispatch(fetchUserStats(user.uid));
    }
  }, [user?.uid, dispatch]);

  const fetchProjects = async () => {
    if (!user?.uid) return;
    dispatch(setLoading(true));
    try {
      const userProjects = await getAllUserProjects();
      dispatch(setProjects(userProjects));
      setStats({
        totalProjects: userProjects.length,
        activeProjects: userProjects.filter(p => p.status === 'active').length,
        completedProjects: userProjects.filter(p => p.status === 'completed').length,
      });
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const groupProjects = (projectsToGroup) => {
    const groups = {};
    projectsToGroup.forEach(project => {
      let groupKey;
      switch (groupBy) {
        case 'status':
          groupKey = project.status || 'unknown';
          break;
        case 'priority':
          groupKey = project.priority || 'medium';
          break;
        case 'category':
          groupKey = project.category || 'general';
          break;
        default:
          groupKey = 'all';
      }
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(project);
    });
    return groups;
  };

  const getFilteredProjects = () => {
    let filtered = [...projects];
    if (filters.status) {
      filtered = filtered.filter(p => p.status === filters.status);
    }
    if (filters.priority) {
      filtered = filtered.filter(p => p.priority === filters.priority);
    }
    if (filters.category) {
      filtered = filtered.filter(p => p.category === filters.category);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(search) || 
        p.description?.toLowerCase().includes(search)
      );
    }
    return filtered;
  };

  const getGroupDisplayName = (key) => {
    const names = {
      active: 'Active Projects',
      completed: 'Completed Projects',
      on_hold: 'On Hold',
      cancelled: 'Cancelled',
      high: 'High Priority',
      medium: 'Medium Priority',
      low: 'Low Priority',
      work: 'Work',
      personal: 'Personal',
      education: 'Education',
      health: 'Health',
      finance: 'Finance',
      all: 'All Projects'
    };
    return names[key] || key;
  };

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ status: '', priority: '', category: '', search: '', dateRange: '' });
  };

  const applyTheme = (newTheme) => {
    setTheme(newTheme);
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${newTheme}`);
    localStorage.setItem('dashboard-theme', newTheme);
  };

  const handleLogout = async () => {
    await logoutUser();
    dispatch(clearUser());
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Fairytale</h1>
          <div className="user-info">
            <button 
              onClick={() => setShowCustomization(!showCustomization)}
              className="customize-btn"
              title="Customize Workspace"
            >
              ⚙️
            </button>
            <span className="user-name" onClick={() => navigate('/profile')}>{user?.displayName || 'User'}</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
        
        {showCustomization && (
          <div className="customization-panel">
            <div className="customization-section">
              <h4>Theme</h4>
              <div className="theme-options">
                <button onClick={() => applyTheme('light')} className={`theme-btn ${theme === 'light' ? 'active' : ''}`}>Light</button>
                <button onClick={() => applyTheme('dark')} className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}>Dark</button>
                <button onClick={() => applyTheme('colorful')} className={`theme-btn ${theme === 'colorful' ? 'active' : ''}`}>Colorful</button>
              </div>
            </div>
            <div className="customization-section">
              <h4>View</h4>
              <div className="view-options">
                <button onClick={() => setViewMode('grid')} className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}>Grid</button>
                <button onClick={() => setViewMode('list')} className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}>List</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <FestiveBanner />

      <div className="dashboard-content">
        <div className="dashboard-main">
          <div className="welcome-section">
            <h2>Welcome, {user?.displayName || 'User'}! 👋</h2>
            <p>Here's what's happening with your projects today.</p>
          </div>

          {showWidgets.stats && (
            <div className="quick-stats">
              <div className="quick-stat">
                <span className="quick-stat-value">{currentStreak}</span>
                <span className="quick-stat-label">Streak</span>
              </div>
              <div className="quick-stat">
                <span className="quick-stat-value">{currentLevel}</span>
                <span className="quick-stat-label">Level</span>
              </div>
              <div className="quick-stat">
                <span className="quick-stat-value">{totalXP.toLocaleString()}</span>
                <span className="quick-stat-label">XP</span>
              </div>
            </div>
          )}

          {showWidgets.quickActions && (
            <div className="quick-actions-widget">
              <h3>Quick Actions</h3>
              <button onClick={() => navigate('/projects/new')} className="action-btn">New Project</button>
              <button onClick={() => navigate('/projects')} className="action-btn">View All</button>
              <button onClick={() => navigate('/profile')} className="action-btn">Profile</button>
            </div>
          )}

          <div className="projects-section">
            <div className="section-header">
              <h2>Your Projects</h2>
              <div className="section-controls">
                <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)} className="group-select">
                  <option value="none">No Grouping</option>
                  <option value="status">Group by Status</option>
                  <option value="priority">Group by Priority</option>
                  <option value="category">Group by Category</option>
                </select>
                <select value={viewMode} onChange={(e) => setViewMode(e.target.value)} className="view-select">
                  <option value="grid">Grid View</option>
                  <option value="list">List View</option>
                </select>
              </div>
            </div>

            <div className="filter-bar">
              <select value={filters.status} onChange={(e) => updateFilter('status', e.target.value)} className="filter-select">
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
              </select>
              <select value={filters.priority} onChange={(e) => updateFilter('priority', e.target.value)} className="filter-select">
                <option value="">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <input type="text" value={filters.search} onChange={(e) => updateFilter('search', e.target.value)} placeholder="Search projects..." className="filter-search" />
              {(filters.status || filters.priority || filters.search) && (
                <button onClick={clearFilters} className="filter-clear">Clear Filters</button>
              )}
            </div>

            {loading ? (
              <div className="loading">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="empty-state">
                <p>No projects yet. Create your first project to get started!</p>
                <button className="primary-btn" onClick={() => navigate('/projects')}>Create Project</button>
              </div>
            ) : (
              <div className="projects-container">
                {groupBy === 'none' ? (
                  <div className={`projects-${viewMode}`}>
                    {getFilteredProjects().slice(0, 6).map(project => (
                      <ProjectCard 
                        key={project.id} 
                        project={project} 
                        viewMode={viewMode}
                        onClick={() => navigate(`/projects/${project.id}`)}
                      />
                    ))}
                  </div>
                ) : (
                  Object.entries(groupProjects(getFilteredProjects())).map(([groupKey, groupProjects]) => (
                    <div key={groupKey} className="project-group">
                      <div className="group-header">
                        <h3>{getGroupDisplayName(groupKey)}</h3>
                        <span className="group-count">{groupProjects.length} projects</span>
                      </div>
                      <div className={`projects-${viewMode}`}>
                        {groupProjects.slice(0, 3).map(project => (
                          <ProjectCard 
                            key={project.id} 
                            project={project} 
                            viewMode={viewMode}
                            onClick={() => navigate(`/projects/${project.id}`)}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-sidebar">
          {showWidgets.rewards && <RewardsDisplay />}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
