// Notes Service - Handles love notes and doodles
import {
  doc,
  collection,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config';

const NOTES_COLLECTION = 'notes';

/**
 * Send a love note (text or doodle)
 * @param {string} coupleId 
 * @param {string} senderId 
 * @param {string} receiverId 
 * @param {object} noteData - { type: 'text'|'doodle', content: string, doodlePaths?: array }
 * @returns {Promise<{success: boolean, noteId: string|null, error: string|null}>}
 */
export const sendNote = async (coupleId, senderId, receiverId, noteData) => {
  try {
    const note = {
      coupleId,
      senderId,
      receiverId,
      type: noteData.type, // 'text' or 'doodle'
      content: noteData.content,
      doodlePaths: noteData.doodlePaths || null, // For doodle notes
      isRead: false,
      isLiked: false,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, NOTES_COLLECTION), note);
    
    return { success: true, noteId: docRef.id, error: null };
  } catch (error) {
    console.error('Error sending note:', error);
    return { success: false, noteId: null, error: error.message };
  }
};

/**
 * Get all notes for a couple
 * @param {string} coupleId 
 * @param {number} limitCount - Number of notes to fetch
 * @returns {Promise<array>}
 */
export const getNotes = async (coupleId, limitCount = 50) => {
  try {
    const q = query(
      collection(db, NOTES_COLLECTION),
      where('coupleId', '==', coupleId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting notes:', error);
    return [];
  }
};

/**
 * Get sent notes by user
 * @param {string} coupleId 
 * @param {string} userId 
 * @param {number} limitCount 
 * @returns {Promise<array>}
 */
export const getSentNotes = async (coupleId, userId, limitCount = 50) => {
  try {
    const q = query(
      collection(db, NOTES_COLLECTION),
      where('coupleId', '==', coupleId),
      where('senderId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting sent notes:', error);
    return [];
  }
};

/**
 * Get received notes for user
 * @param {string} coupleId 
 * @param {string} userId 
 * @param {number} limitCount 
 * @returns {Promise<array>}
 */
export const getReceivedNotes = async (coupleId, userId, limitCount = 50) => {
  try {
    const q = query(
      collection(db, NOTES_COLLECTION),
      where('coupleId', '==', coupleId),
      where('receiverId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting received notes:', error);
    return [];
  }
};

/**
 * Get unread notes for user
 * @param {string} coupleId 
 * @param {string} userId 
 * @returns {Promise<array>}
 */
export const getUnreadNotes = async (coupleId, userId) => {
  try {
    const q = query(
      collection(db, NOTES_COLLECTION),
      where('coupleId', '==', coupleId),
      where('receiverId', '==', userId),
      where('isRead', '==', false),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting unread notes:', error);
    return [];
  }
};

/**
 * Mark note as read
 * @param {string} noteId 
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const markNoteAsRead = async (noteId) => {
  try {
    const docRef = doc(db, NOTES_COLLECTION, noteId);
    await updateDoc(docRef, { isRead: true });
    return { success: true, error: null };
  } catch (error) {
    console.error('Error marking note as read:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Mark all notes as read for a user
 * @param {string} coupleId 
 * @param {string} userId 
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const markAllNotesAsRead = async (coupleId, userId) => {
  try {
    const unreadNotes = await getUnreadNotes(coupleId, userId);
    
    if (unreadNotes.length === 0) {
      return { success: true, error: null };
    }
    
    const batch = writeBatch(db);
    unreadNotes.forEach(note => {
      batch.update(doc(db, NOTES_COLLECTION, note.id), { isRead: true });
    });
    
    await batch.commit();
    return { success: true, error: null };
  } catch (error) {
    console.error('Error marking all notes as read:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Toggle like on a note
 * @param {string} noteId 
 * @param {boolean} isLiked 
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const toggleNoteLike = async (noteId, isLiked) => {
  try {
    const docRef = doc(db, NOTES_COLLECTION, noteId);
    await updateDoc(docRef, { isLiked });
    return { success: true, error: null };
  } catch (error) {
    console.error('Error toggling note like:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a note
 * @param {string} noteId 
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const deleteNote = async (noteId) => {
  try {
    await deleteDoc(doc(db, NOTES_COLLECTION, noteId));
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting note:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Subscribe to new notes (real-time)
 * @param {string} coupleId 
 * @param {function} callback 
 * @returns {function} Unsubscribe function
 */
export const subscribeToNotes = (coupleId, callback) => {
  const q = query(
    collection(db, NOTES_COLLECTION),
    where('coupleId', '==', coupleId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const notes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(notes);
  });
};

/**
 * Get unread notes count
 * @param {string} coupleId 
 * @param {string} userId 
 * @returns {Promise<number>}
 */
export const getUnreadNotesCount = async (coupleId, userId) => {
  const unreadNotes = await getUnreadNotes(coupleId, userId);
  return unreadNotes.length;
};
