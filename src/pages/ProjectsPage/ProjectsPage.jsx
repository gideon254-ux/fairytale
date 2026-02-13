import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getAllUserProjects, createProject, deleteProject } from '../../services/projectService';
import { setProjects, addProject, removeProject, setLoading } from '../../store/slices/projectSlice';
import Countdown from '../../components/Countdown';
import './ProjectsPage.css';

function ProjectsPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { projects, loading } = useSelector(state => state.projects);
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', dueDate: '' });
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    dispatch(setLoading(true));
    try {
      const userProjects = await getAllUserProjects();
      dispatch(setProjects(userProjects));
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setError('');
    setCreating(true);

    try {
      if (!newProject.name.trim()) {
        setError('Project name is required');
        return;
      }

      const projectId = await createProject({
        name: newProject.name,
        description: newProject.description,
        dueDate: newProject.dueDate || null,
      });

      const newProjectData = {
        id: projectId,
        name: newProject.name,
        description: newProject.description,
        dueDate: newProject.dueDate || null,
        status: 'active',
        memberCount: 1,
        taskCount: 0,
      };

      dispatch(addProject(newProjectData));
      setShowModal(false);
      setNewProject({ name: '', description: '', dueDate: '' });
      navigate(`/projects/${projectId}`);
    } catch (error) {
      setError(error.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (projectId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteProject(projectId);
        dispatch(removeProject(projectId));
      } catch (error) {
        console.error('Failed to delete project:', error);
      }
    }
  };

  const isCountdownExpired = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate).getTime() < Date.now();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="projects-container">
      <div className="projects-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>
            ← Back
          </button>
          <h1>Projects</h1>
        </div>
        <button className="create-btn" onClick={() => setShowModal(true)}>
          + New Project
        </button>
      </div>

      <div className="projects-content">
        {loading ? (
          <div className="loading">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"></div>
            <h2>No projects yet</h2>
            <p>Create your first project to get started</p>
            <button className="primary-btn" onClick={() => setShowModal(true)}>
              Create Project
            </button>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map(project => (
                <div
                  key={project.id}
                  className="project-card"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <div className="project-card-header">
                    <h3>{project.name}</h3>
                    <span className={`status-badge status-${project.status}`}>
                      {project.status}
                    </span>
                  </div>
                  <p className="project-description">
                    {project.description || 'No description'}
                  </p>
                  {project.dueDate && (
                    <div className="project-countdown-small">
                      <Countdown dueDate={project.dueDate} />
                      <span className="deadline-text">
                        Deadline: {formatDate(project.dueDate)}
                      </span>
                    </div>
                  )}
                  <div className="project-meta">
                    <span>{project.taskCount || 0} tasks</span>
                    <span>{project.teamMembers?.length || 1} members</span>
                  </div>
                  <div className="project-actions">
                    <button
                      className="delete-btn"
                      onClick={(e) => handleDeleteProject(project.id, e)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Project</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label htmlFor="projectName">Project Name *</label>
                <input
                  id="projectName"
                  type="text"
                  placeholder="Enter project name"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="projectDescription">Description</label>
                <textarea
                  id="projectDescription"
                  placeholder="Describe your project"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  rows="4"
                />
              </div>
              <div className="form-group">
                <label htmlFor="projectDueDate">Deadline (Optional)</label>
                <input
                  id="projectDueDate"
                  type="datetime-local"
                  value={newProject.dueDate}
                  onChange={(e) => setNewProject({ ...newProject, dueDate: e.target.value })}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              {error && <div className="error-message">{error}</div>}
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectsPage;
