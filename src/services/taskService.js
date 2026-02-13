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
} from 'firebase/firestore';
import { db } from '../firebase.config';
import { completeTask } from './rewardsService';
import { getCurrentUser } from './authService';

export const createTask = async (taskData, projectId, userId) => {
  try {
    const docRef = await addDoc(collection(db, 'tasks'), {
      ...taskData,
      projectId,
      reporterId: userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      status: 'to_do',
      progressPercentage: 0,
    });
    return docRef.id;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const getProjectTasks = async (projectId) => {
  try {
    const q = query(
      collection(db, 'tasks'),
      where('projectId', '==', projectId)
    );
    const querySnapshot = await getDocs(q);
    const tasks = [];
    querySnapshot.forEach((doc) => {
      tasks.push({ id: doc.id, ...doc.data() });
    });
    return tasks;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const getTask = async (taskId) => {
  try {
    const docRef = doc(db, 'tasks', taskId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const updateTask = async (taskId, updateData) => {
  try {
    const docRef = doc(db, 'tasks', taskId);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    throw new Error(error.message);
  }
};

export const updateTaskStatus = async (taskId, status) => {
  try {
    const user = getCurrentUser();
    const docRef = doc(db, 'tasks', taskId);
    const updatePayload = { status, updatedAt: Timestamp.now() };
    if (status === 'done') {
      updatePayload.completedAt = Timestamp.now();
      updatePayload.progressPercentage = 100;
      if (user) {
        await completeTask(user.uid);
      }
    }
    await updateDoc(docRef, updatePayload);
  } catch (error) {
    throw new Error(error.message);
  }
};

export const deleteTask = async (taskId) => {
  try {
    const docRef = doc(db, 'tasks', taskId);
    await deleteDoc(docRef);
  } catch (error) {
    throw new Error(error.message);
  }
};
