import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getAllUserProjects } from '../../services/projectService';
import { setProjects, setLoading } from '../../store/slices/projectSlice';
import { fetchUserStats } from '../../store/slices/userStatsSlice';
import { logoutUser } from '../../services/authService';
import { clearUser } from '../../store/slices/authSlice';
import RewardsDisplay from '../../components/RewardsDisplay';
import FestiveBanner from '../../components/FestiveBanner';
import ProjectCountdown from '../../components/ProjectCountdown';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import './DashboardPage.css';

const ProjectCard = ({ project, viewMode, onClick }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'project',
    item: { id: project.id, type: 'project' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: 'project',
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
    hover(item, monitor) {
      if (!monitor.isOver()) {
        setDropTarget(project.id);
      }
    },
    drop(item, monitor) {
      if (item.id !== project.id) {
        handleProjectDrop(item.id, project.id);
      }
      setDropTarget(null);
    },
  });

  const opacity = isDragging ? 0.5 : 1;
  const backgroundColor = isOver ? '#e0f7fa' : 'white';
  const border = dropTarget === project.id ? '2px solid #667eea' : '1px solid #f0f0f0';

  return (
    <div
      ref={(node) => {
        drag(node);
        drop(node);
      }}
      className={`project-card project-card-${viewMode}`}
      onClick={onClick}
      style={{ opacity, backgroundColor, border }}
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
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('grid');
  const [theme, setTheme] = useState('light');
  const [layout, setLayout] = useState('default');
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
  const [dragging, setDragging] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);

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

  const handleProjectDrop = async (sourceId, targetId) => {
    try {
      const sourceProject = projects.find(p => p.id === sourceId);
      const targetProject = projects.find(p => p.id === targetId);
      
      if (!sourceProject || !targetProject) return;
      
      // Update project order in database
      const updatedProjects = projects.map(project => {
        if (project.id === sourceId) {
          return { ...project, order: targetProject.order };
        }
        if (project.id === targetId) {
          return { ...project, order: sourceProject.order };
        }
        return project;
      });
      
      dispatch(setProjects(updatedProjects));
      
      // Update in Firebase
      const userRef = doc(db, 'users', user.uid, 'projects', sourceId);
      await updateDoc(userRef, { order: targetProject.order });
      
      const targetRef = doc(db, 'users', user.uid, 'projects', targetId);
      await updateDoc(targetRef, { order: sourceProject.order });
      
    } catch (error) {
      console.error('Failed to update project order:', error);
    } finally {
      setDragging(null);
      setDropTarget(null);
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
        case 'dueDate':
          const dueDate = new Date(project.dueDate || '9999-12-31');
          const today = new Date();
          const diffTime = dueDate - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays < 0) groupKey = 'overdue';
          else if (diffDays <= 3) groupKey = 'due-soon';
          else if (diffDays <= 7) groupKey = 'this-week';
          else if (diffDays <= 30) groupKey = 'this-month';
          else groupKey = 'future';
          break;
        default:
          groupKey = 'all';
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(project);
    });
    
    // Sort projects within each group
    Object.keys(groups).forEach(groupKey => {
      groups[groupKey] = sortProjects(groups[groupKey]);
    });
    
    return groups;
  };

  const getGroupDisplayName = (groupKey) => {
    const names = {
      'active': 'Active Projects',
      'completed': 'Completed Projects',
      'paused': 'Paused Projects',
      'planning': 'Planning',
      'high': 'High Priority',
      'medium': 'Medium Priority',
      'low': 'Low Priority',
      'overdue': 'Overdue',
      'due-soon': 'Due Soon (≤3 days)',
      'this-week': 'This Week',
      'this-month': 'This Month',
      'future': 'Future',
      'general': 'General',
      'work': 'Work',
      'personal': 'Personal',
      'unknown': 'Unknown'
    };
    
    return names[groupKey] || groupKey.charAt(0).toUpperCase() + groupKey.slice(1);
  };

  const applyFilters = (projectsToFilter) => {
    return projectsToFilter.filter(project => {
      // Status filter
      if (filters.status && project.status !== filters.status) {
        return false;
      }
      
      // Priority filter
      if (filters.priority && project.priority !== filters.priority) {
        return false;
      }
      
      // Category filter
      if (filters.category && project.category !== filters.category) {
        return false;
      }
      
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const nameMatch = (project.name || '').toLowerCase().includes(searchLower);
        const descMatch = (project.description || '').toLowerCase().includes(searchLower);
        if (!nameMatch && !descMatch) {
          return false;
        }
      }
      
      // Date range filter
      if (filters.dateRange && project.dueDate) {
        const projectDate = new Date(project.dueDate);
        const today = new Date();
        const diffTime = projectDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        switch (filters.dateRange) {
          case 'overdue':
            if (diffDays >= 0) return false;
            break;
          case 'week':
            if (diffDays < 0 || diffDays > 7) return false;
            break;
          case 'month':
            if (diffDays < 0 || diffDays > 30) return false;
            break;
          case 'quarter':
            if (diffDays < 0 || diffDays > 90) return false;
            break;
        }
      }
      
      return true;
    });
  };

  const updateFilter = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      priority: '',
      category: '',
      search: '',
      dateRange: ''
    });
  };

  const getFilteredProjects = () => {
    const filtered = applyFilters(projects);
    return groupBy === 'none' ? sortProjects(filtered) : groupProjects(filtered);
  };

  const toggleWidget = (widgetName) => {
    setShowWidgets(prev => ({
      ...prev,
      [widgetName]: !prev[widgetName]
    }));
  };

  const applyTheme = (newTheme) => {
    setTheme(newTheme);
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${newTheme}`);
    localStorage.setItem('dashboard-theme', newTheme);
  };

  const applyLayout = (newLayout) => {
    setLayout(newLayout);
    document.body.className = document.body.className.replace(/layout-\w+/g, '');
    document.body.classList.add(`layout-${newLayout}`);
    localStorage.setItem('dashboard-layout', newLayout);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('dashboard-theme');
    const savedLayout = localStorage.getItem('dashboard-layout');
    const savedWidgets = localStorage.getItem('dashboard-widgets');
    
    if (savedTheme) applyTheme(savedTheme);
    if (savedLayout) applyLayout(savedLayout);
    if (savedWidgets) setShowWidgets(JSON.parse(savedWidgets));
  }, []);

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
                <button 
                  onClick={() => applyTheme('light')}
                  className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                >
                  ☀️ Light
                </button>
                <button 
                  onClick={() => applyTheme('dark')}
                  className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                >
                  🌙 Dark
                </button>
                <button 
                  onClick={() => applyTheme('auto')}
                  className={`theme-btn ${theme === 'auto' ? 'active' : ''}`}
                >
                  🌗 Auto
                </button>
              </div>
            </div>
            
            <div className="customization-section">
              <h4>Layout</h4>
              <div className="layout-options">
                <button 
                  onClick={() => applyLayout('default')}
                  className={`layout-btn ${layout === 'default' ? 'active' : ''}`}
                >
                  Default
                </button>
                <button 
                  onClick={() => applyLayout('compact')}
                  className={`layout-btn ${layout === 'compact' ? 'active' : ''}`}
                >
                  Compact
                </button>
                <button 
                  onClick={() => applyLayout('wide')}
                  className={`layout-btn ${layout === 'wide' ? 'active' : ''}`}
                >
                  Wide
                </button>
              </div>
            </div>
            
            <div className="customization-section">
              <h4>Widgets</h4>
              <div className="widget-toggles">
                <label className="widget-toggle">
                  <input 
                    type="checkbox" 
                    checked={showWidgets.stats}
                    onChange={() => toggleWidget('stats')}
                  />
                  <span>Statistics</span>
                </label>
                <label className="widget-toggle">
                  <input 
                    type="checkbox" 
                    checked={showWidgets.rewards}
                    onChange={() => toggleWidget('rewards')}
                  />
                  <span>Rewards</span>
                </label>
                <label className="widget-toggle">
                  <input 
                    type="checkbox" 
                    checked={showWidgets.quickActions}
                    onChange={() => toggleWidget('quickActions')}
                  />
                  <span>Quick Actions</span>
                </label>
                <label className="widget-toggle">
                  <input 
                    type="checkbox" 
                    checked={showWidgets.recentActivity}
                    onChange={() => toggleWidget('recentActivity')}
                  />
                  <span>Recent Activity</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="dashboard-content">
        <div className="dashboard-main">
          <FestiveBanner />
          <div className="dashboard-welcome">
            <div>
              <h2>Welcome, {user?.displayName || 'User'}! 👋</h2>
              <p>Here's what's happening with your projects today.</p>
            </div>
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
          </div>

          {showWidgets.stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon project-icon"></div>
              <div className="stat-content">
                <h3>Total Projects</h3>
                <p className="stat-number">{stats.totalProjects}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon project-icon"></div>
              <div className="stat-content">
                <h3>Active Projects</h3>
                <p className="stat-number">{stats.activeProjects}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon complete-icon"></div>
              <div className="stat-content">
                <h3>Completed</h3>
                <p className="stat-number">{stats.completedProjects}</p>
              </div>
            </div>
          </div>
        )}

        {showWidgets.quickActions && (
          <div className="quick-actions">
            <h3>Quick Actions</h3>
            <div className="action-buttons">
              <button onClick={() => navigate('/projects/new')} className="action-btn">
                ➕ New Project
              </button>
              <button onClick={() => navigate('/projects')} className="action-btn">
                📋 View All Projects
              </button>
              <button onClick={() => navigate('/profile')} className="action-btn">
                👤 Profile Settings
              </button>
            </div>
          </div>
        )}

<div className="dashboard-section">
            <div className="section-header">
              <h2>Your Projects</h2>
              <div className="section-controls">
                <div className="view-controls">
                  <select 
                    value={groupBy} 
                    onChange={(e) => setGroupBy(e.target.value)}
                    className="control-select"
                  >
                    <option value="status">Group by Status</option>
                    <option value="priority">Group by Priority</option>
                    <option value="category">Group by Category</option>
                    <option value="dueDate">Group by Due Date</option>
                    <option value="none">No Grouping</option>
                  </select>
                  
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className="control-select"
                  >
                    <option value="name">Sort by Name</option>
                    <option value="dueDate">Sort by Due Date</option>
                    <option value="created">Sort by Created</option>
                    <option value="progress">Sort by Progress</option>
                    <option value="tasks">Sort by Tasks</option>
                  </select>
                  
                  <button 
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="control-btn"
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                  
                  <div className="view-toggle">
                    <button 
                      onClick={() => setViewMode('grid')}
                      className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    >
                      Grid
                    </button>
                    <button 
                      onClick={() => setViewMode('list')}
                      className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                    >
                      List
                    </button>
                  </div>
                </div>
                
                <button className="create-btn" onClick={() => navigate('/projects')}>
                  View All Projects
                </button>
              </div>
              
              <div className="filter-controls">
                <select 
                  value={filters.status} 
                  onChange={(e) => updateFilter('status', e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="paused">Paused</option>
                  <option value="planning">Planning</option>
                </select>
                
                <select 
                  value={filters.priority} 
                  onChange={(e) => updateFilter('priority', e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                
                <select 
                  value={filters.category} 
                  onChange={(e) => updateFilter('category', e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Categories</option>
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                  <option value="education">Education</option>
                  <option value="health">Health</option>
                  <option value="finance">Finance</option>
                </select>
                
                <select 
                  value={filters.dateRange} 
                  onChange={(e) => updateFilter('dateRange', e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Dates</option>
                  <option value="overdue">Overdue</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                </select>
                
                <input 
                  type="text" 
                  value={filters.search} 
                  onChange={(e) => updateFilter('search', e.target.value)}
                  placeholder="Search projects..."
                  className="filter-search"
                />
                
                <button 
                  onClick={clearFilters}
                  className="filter-clear"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {loading ? (
              <div className="loading">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="empty-state">
                <p>No projects yet. Create your first project to get started!</p>
                <button className="primary-btn" onClick={() => navigate('/projects')}>
                  Create Project
                </button>
              </div>
            ) : (
              <div className="projects-container">
                {groupBy === 'none' ? (
                  <DndProvider backend={HTML5Backend}>
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
                    </DndProvider>
                ) : (
                  Object.entries(getFilteredProjects()).map(([groupKey, groupProjects]) => (
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
                )
              </div>
            )}
          </div>
        ) : (
          <div className="dashboard-sidebar">
            {showWidgets.rewards && <RewardsDisplay />}
          </div>
        )
      )
    </div>
  );
}

export default DashboardPage;
