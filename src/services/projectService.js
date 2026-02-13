import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '../firebase.config';
import { getCurrentUser } from './authService';
import { createProject as awardXPForProject, completeProject as awardXPForComplete } from './rewardsService';

export const createProject = async (projectData) => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const docRef = await addDoc(collection(db, 'projects'), {
      ...projectData,
      ownerId: user.uid,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      status: 'active',
      taskCount: 0,
      teamMembers: [
        {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email,
          role: 'owner',
          joinedAt: Timestamp.now(),
        }
      ],
    });

    await awardXPForProject(user.uid);
    return docRef.id;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const getUserProjects = async () => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const q = query(
      collection(db, 'projects'),
      where('ownerId', '==', user.uid)
    );
    const querySnapshot = await getDocs(q);
    const projects = [];
    querySnapshot.forEach((doc) => {
      projects.push({ id: doc.id, ...doc.data() });
    });
    return projects;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const getSharedProjects = async () => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const q = query(
      collection(db, 'projects'),
      where('teamMembers', 'array-contains', {
        uid: user.uid,
        role: 'member'
      })
    );
    const querySnapshot = await getDocs(q);
    const projects = [];
    querySnapshot.forEach((doc) => {
      projects.push({ id: doc.id, ...doc.data() });
    });
    return projects;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const getAllUserProjects = async () => {
  const ownedProjects = await getUserProjects();
  const sharedProjects = await getSharedProjects();
  const allProjects = [...ownedProjects];
  const existingIds = new Set(allProjects.map(p => p.id));
  sharedProjects.forEach(p => {
    if (!existingIds.has(p.id)) {
      allProjects.push(p);
    }
  });
  return allProjects;
};

export const getProject = async (projectId) => {
  try {
    const docRef = doc(db, 'projects', projectId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const updateProject = async (projectId, updateData) => {
  try {
    const docRef = doc(db, 'projects', projectId);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

export const deleteProject = async (projectId) => {
  try {
    const docRef = doc(db, 'projects', projectId);
    await deleteDoc(docRef);
  } catch (error) {
    throw new Error(error.message);
  }
};

export const addTeamMember = async (projectId, email, role = 'member') => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const docRef = doc(db, 'projects', projectId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Project not found');
    }

    const project = docSnap.data();
    if (project.ownerId !== user.uid) {
      throw new Error('Only the project owner can add team members');
    }

    const newMember = {
      uid: `invite-${Date.now()}`,
      email: email,
      displayName: email.split('@')[0],
      role: role,
      invitedBy: user.uid,
      invitedAt: Timestamp.now(),
      status: 'pending',
    };

    await updateDoc(docRef, {
      teamMembers: arrayUnion(newMember),
      pendingInvites: arrayUnion(email),
      updatedAt: Timestamp.now(),
    });

    return newMember;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const removeTeamMember = async (projectId, memberEmail) => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const docRef = doc(db, 'projects', projectId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Project not found');
    }

    const project = docSnap.data();
    if (project.ownerId !== user.uid) {
      throw new Error('Only the project owner can remove team members');
    }

    const memberToRemove = project.teamMembers.find(m => m.email === memberEmail);
    if (memberToRemove) {
      await updateDoc(docRef, {
        teamMembers: arrayRemove(memberToRemove),
        updatedAt: Timestamp.now(),
      });
    }
  } catch (error) {
    throw new Error(error.message);
  }
};

export const updateMemberRole = async (projectId, memberEmail, newRole) => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const docRef = doc(db, 'projects', projectId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Project not found');
    }

    const project = docSnap.data();
    if (project.ownerId !== user.uid) {
      throw new Error('Only the project owner can change member roles');
    }

    const updatedMembers = project.teamMembers.map(m => {
      if (m.email === memberEmail && m.role !== 'owner') {
        return { ...m, role: newRole };
      }
      return m;
    });

    await updateDoc(docRef, {
      teamMembers: updatedMembers,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    throw new Error(error.message);
  }
};
