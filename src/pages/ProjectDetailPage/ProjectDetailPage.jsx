import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getProjectTasks, createTask, updateTaskStatus, deleteTask } from '../../services/taskService';
import { getProject, updateProject } from '../../services/projectService';
import { completeProject as markProjectComplete } from '../../services/rewardsService';
import { setTasks, addTask, deleteTask as removeTask, updateTask } from '../../store/slices/taskSlice';
import ProjectCountdown from '../../components/ProjectCountdown';
import TeamManagement from '../../components/TeamManagement';
import './ProjectDetailPage.css';

function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { tasks, loading: tasksLoading } = useSelector(state => state.tasks);
  
  const [project, setProject] = useState(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('tasks');

  useEffect(() => {
    loadProjectAndTasks();
  }, [projectId]);

  const loadProjectAndTasks = async () => {
    try {
      setProjectLoading(true);
      setError('');
      
      const projectData = await getProject(projectId);
      if (!projectData) {
        setError('Project not found');
        navigate('/projects');
        return;
      }
      setProject(projectData);

      const tasksData = await getProjectTasks(projectId);
      dispatch(setTasks(tasksData));
    } catch (err) {
      setError(err.message);
    } finally {
      setProjectLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      setCreatingTask(true);
      setError('');
      
      const taskId = await createTask(
        {
          title: newTaskTitle.trim(),
          description: newTaskDescription.trim(),
        },
        projectId,
        user.uid
      );

      const newTask = {
        id: taskId,
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim(),
        projectId,
        reporterId: user.uid,
        status: 'to_do',
        progressPercentage: 0,
      };
      
      dispatch(addTask(newTask));
      setNewTaskTitle('');
      setNewTaskDescription('');
      setShowCreateModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreatingTask(false);
    }
  };

  const handleToggleTaskStatus = async (task) => {
    try {
      const newStatus = task.status === 'done' ? 'to_do' : 'done';
      await updateTaskStatus(task.id, newStatus);
      
      const updatedTask = { ...task, status: newStatus };
      dispatch(updateTask(updatedTask));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      setError('');
      await deleteTask(taskId);
      dispatch(removeTask(taskId));
    } catch (err) {
      setError(err.message);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCompleteProject = async () => {
    if (!window.confirm('Complete this project? You will earn XP!')) return;

    try {
      setError('');
      await markProjectComplete(user.uid);
      await updateProject(projectId, { status: 'completed' });
      setProject({ ...project, status: 'completed' });
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'active') return task.status !== 'done';
    if (filter === 'completed') return task.status === 'done';
    return true;
  });

  const activeTasksCount = tasks.filter(t => t.status !== 'done').length;
  const completedTasksCount = tasks.filter(t => t.status === 'done').length;

  if (projectLoading) {
    return (
      <div className="project-detail-container">
        <div className="loading">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="project-detail-container">
        <div className="project-detail-content">
          <div className="empty-state">
            <h3>Project not found</h3>
            <p>The project you're looking for doesn't exist or has been deleted.</p>
            <button className="primary-btn" onClick={() => navigate('/projects')}>
              Back to Projects
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="project-detail-container">
      <header className="project-detail-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="back-btn" onClick={() => navigate('/projects')}>
            ← Back
          </button>
          <h1>{project.name}</h1>
        </div>
        <button className="create-btn" onClick={() => setShowCreateModal(true)}>
          + Add Task
        </button>
      </header>

      <main className="project-detail-content">
        {error && <div className="error-message">{error}</div>}

        <section className="project-info">
          <div className="project-info-header">
            <div>
              <h2>{project.name}</h2>
              <p className="description">{project.description || 'No description provided'}</p>
            </div>
            {project.dueDate && (
              <div className="project-countdown">
                <ProjectCountdown dueDate={project.dueDate} />
                <span className="deadline-label">Deadline: {formatDateTime(project.dueDate)}</span>
              </div>
            )}
          </div>
          <div className="project-meta">
            <span>Created: {formatDate(project.createdAt)}</span>
            <span>Tasks: {tasks.length}</span>
            <span>Team: {project.teamMembers?.length || 1} members</span>
            <span className={`status-badge status-${project.status}`}>{project.status}</span>
            {project.status !== 'completed' && (
              <button className="complete-project-btn" onClick={handleCompleteProject}>
                Complete Project
              </button>
            )}
          </div>
        </section>

        <section className="detail-tabs">
          <button
            className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            Tasks
          </button>
          <button
            className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`}
            onClick={() => setActiveTab('team')}
          >
            Team
          </button>
        </section>

        {activeTab === 'tasks' && (
          <section className="tasks-section">
            <div className="tasks-header">
              <h2>Tasks ({activeTasksCount} active, {completedTasksCount} completed)</h2>
              <div className="task-filters">
                <button 
                  className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  All
                </button>
                <button 
                  className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
                  onClick={() => setFilter('active')}
                >
                  Active
                </button>
                <button 
                  className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
                  onClick={() => setFilter('completed')}
                >
                  Completed
                </button>
              </div>
            </div>

            {tasksLoading ? (
              <div className="loading">Loading tasks...</div>
            ) : filteredTasks.length === 0 ? (
              <div className="empty-tasks">
                <div className="empty-tasks-icon"></div>
                <h3>No tasks yet</h3>
                <p>Create your first task to get started</p>
                <button className="primary-btn" onClick={() => setShowCreateModal(true)}>
                  + Add Task
                </button>
              </div>
            ) : (
              <div className="tasks-list">
                {filteredTasks.map(task => (
                  <div 
                    key={task.id} 
                    className={`task-item ${task.status === 'done' ? 'completed' : ''}`}
                  >
                    <div 
                      className={`task-checkbox ${task.status === 'done' ? 'checked' : ''}`}
                      onClick={() => handleToggleTaskStatus(task)}
                    />
                    <div className="task-content">
                      <h4 className="task-title">{task.title}</h4>
                      {task.description && (
                        <p className="task-meta">{task.description}</p>
                      )}
                    </div>
                    <div className="task-actions">
                      <button 
                        className="task-action-btn delete"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'team' && (
          <TeamManagement
            project={project}
            onProjectUpdate={loadProjectAndTasks}
          />
        )}
      </main>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Task</h2>
              <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label htmlFor="taskTitle">Task Title *</label>
                <input
                  type="text"
                  id="taskTitle"
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  placeholder="Enter task title"
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="taskDescription">Description</label>
                <textarea
                  id="taskDescription"
                  value={newTaskDescription}
                  onChange={e => setNewTaskDescription(e.target.value)}
                  placeholder="Enter task description (optional)"
                  rows="3"
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={!newTaskTitle.trim() || creatingTask}
                >
                  {creatingTask ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectDetailPage;
