import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { addTeamMember, removeTeamMember, updateMemberRole } from '../services/projectService';
import './TeamManagement.css';

function TeamManagement({ project, onProjectUpdate }) {
  const { user } = useSelector(state => state.auth);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isOwner = project?.ownerId === user?.uid;
  const teamMembers = project?.teamMembers || [];

  const handleInvite = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await addTeamMember(project.id, inviteEmail, inviteRole);
      setSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setShowInviteModal(false);
      if (onProjectUpdate) onProjectUpdate();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (email) => {
    if (!window.confirm(`Remove ${email} from this project?`)) return;

    setLoading(true);
    setError('');
    try {
      await removeTeamMember(project.id, email);
      if (onProjectUpdate) onProjectUpdate();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (email, newRole) => {
    try {
      await updateMemberRole(project.id, email, newRole);
      if (onProjectUpdate) onProjectUpdate();
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

  const getRoleLabel = (role) => {
    switch (role) {
      case 'owner': return 'Owner';
      case 'admin': return 'Admin';
      case 'member': return 'Member';
      case 'viewer': return 'Viewer';
      default: return role;
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'owner': return 'role-owner';
      case 'admin': return 'role-admin';
      case 'member': return 'role-member';
      case 'viewer': return 'role-viewer';
      default: return 'role-member';
    }
  };

  const pendingInvites = project?.pendingInvites || [];

  return (
    <div className="team-management">
      <div className="team-header">
        <h3>Team Members ({teamMembers.length})</h3>
        {isOwner && (
          <button className="invite-btn" onClick={() => setShowInviteModal(true)}>
            Invite Member
          </button>
        )}
      </div>

      {error && <div className="team-error">{error}</div>}
      {success && <div className="team-success">{success}</div>}

      <div className="team-list">
        {teamMembers.map((member) => (
          <div key={member.email} className="team-member">
            <div className="member-avatar">
              {member.displayName?.charAt(0).toUpperCase() || member.email.charAt(0).toUpperCase()}
            </div>
            <div className="member-info">
              <div className="member-name">
                {member.displayName || member.email}
                {member.uid === user?.uid && <span className="you-badge">You</span>}
              </div>
              <div className="member-email">{member.email}</div>
              {member.joinedAt && (
                <div className="member-date">Joined {formatDate(member.joinedAt)}</div>
              )}
            </div>
            <div className="member-role">
              <span className={`role-badge ${getRoleBadgeClass(member.role)}`}>
                {getRoleLabel(member.role)}
              </span>
              {isOwner && member.role !== 'owner' && (
                <div className="role-actions">
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.email, e.target.value)}
                    className="role-select"
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button
                    className="remove-btn"
                    onClick={() => handleRemove(member.email)}
                    title="Remove member"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {pendingInvites.length > 0 && (
        <div className="pending-invites">
          <h4>Pending Invitations</h4>
          {pendingInvites.map((email) => (
            <div key={email} className="pending-invite">
              <span className="pending-email">{email}</span>
              <span className="pending-status">Invitation sent</span>
            </div>
          ))}
        </div>
      )}

      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal team-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Invite Team Member</h2>
              <button className="close-btn" onClick={() => setShowInviteModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleInvite}>
              <div className="form-group">
                <label htmlFor="inviteEmail">Email Address</label>
                <input
                  type="email"
                  id="inviteEmail"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="inviteRole">Role</label>
                <select
                  id="inviteRole"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="role-select-full"
                >
                  <option value="admin">Admin - Can edit and manage team</option>
                  <option value="member">Member - Can edit tasks</option>
                  <option value="viewer">Viewer - Read only access</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowInviteModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamManagement;
