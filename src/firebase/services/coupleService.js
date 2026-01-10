// Couple Service - Handles partner connection and couple data
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config';
import { getUserProfile, getUserByInviteCode, updateUserProfile } from './userService';

const COUPLES_COLLECTION = 'couples';
const USERS_COLLECTION = 'users';

/**
 * Connect two users as a couple using invite code
 * @param {string} userId - Current user's ID
 * @param {string} inviteCode - Partner's invite code
 * @returns {Promise<{success: boolean, coupleId: string|null, partner: object|null, error: string|null}>}
 */
export const connectWithPartner = async (userId, inviteCode) => {
  try {
    // Find partner by invite code
    const partner = await getUserByInviteCode(inviteCode);
    
    if (!partner) {
      return { success: false, coupleId: null, partner: null, error: 'Invalid invite code' };
    }
    
    if (partner.id === userId) {
      return { success: false, coupleId: null, partner: null, error: 'Cannot connect with yourself' };
    }
    
    if (partner.coupleId) {
      return { success: false, coupleId: null, partner: null, error: 'This user is already connected' };
    }
    
    // Get current user
    const currentUser = await getUserProfile(userId);
    if (!currentUser) {
      return { success: false, coupleId: null, partner: null, error: 'User not found' };
    }
    
    if (currentUser.coupleId) {
      return { success: false, coupleId: null, partner: null, error: 'You are already connected to a partner' };
    }
    
    // Create couple document
    const coupleRef = doc(collection(db, COUPLES_COLLECTION));
    const coupleId = coupleRef.id;
    
    const coupleData = {
      id: coupleId,
      user1Id: userId,
      user2Id: partner.id,
      user1Name: currentUser.displayName,
      user2Name: partner.displayName,
      coupleName: `${currentUser.displayName} & ${partner.displayName}`,
      connectedAt: serverTimestamp(),
      anniversary: null,
      pet: {
        name: 'Piggy',
        skin: 'piggy',
        happiness: 80,
        hunger: 50,
        lastFed: null,
        lastPlayed: null,
      },
      loveZone: {
        level: 1,
        unlockedItems: [],
        placedItems: [],
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    // Use batch write for atomic operation
    const batch = writeBatch(db);
    
    // Create couple document
    batch.set(coupleRef, coupleData);
    
    // Update both users with couple info
    batch.update(doc(db, USERS_COLLECTION, userId), {
      coupleId,
      partnerId: partner.id,
      updatedAt: serverTimestamp(),
    });
    
    batch.update(doc(db, USERS_COLLECTION, partner.id), {
      coupleId,
      partnerId: userId,
      updatedAt: serverTimestamp(),
    });
    
    await batch.commit();
    
    return { success: true, coupleId, partner, error: null };
  } catch (error) {
    console.error('Error connecting with partner:', error);
    return { success: false, coupleId: null, partner: null, error: error.message };
  }
};

/**
 * Get couple data by ID
 * @param {string} coupleId 
 * @returns {Promise<object|null>}
 */
export const getCouple = async (coupleId) => {
  try {
    const docRef = doc(db, COUPLES_COLLECTION, coupleId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting couple:', error);
    return null;
  }
};

/**
 * Get couple by user ID
 * @param {string} userId 
 * @returns {Promise<object|null>}
 */
export const getCoupleByUserId = async (userId) => {
  try {
    const user = await getUserProfile(userId);
    if (!user || !user.coupleId) return null;
    
    return await getCouple(user.coupleId);
  } catch (error) {
    console.error('Error getting couple by user ID:', error);
    return null;
  }
};

/**
 * Update couple data
 * @param {string} coupleId 
 * @param {object} updates 
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const updateCouple = async (coupleId, updates) => {
  try {
    const docRef = doc(db, COUPLES_COLLECTION, coupleId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating couple:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update couple name
 * @param {string} coupleId 
 * @param {string} coupleName 
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const updateCoupleName = async (coupleId, coupleName) => {
  return updateCouple(coupleId, { coupleName });
};

/**
 * Set anniversary date
 * @param {string} coupleId 
 * @param {Date} date 
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const setAnniversary = async (coupleId, date) => {
  return updateCouple(coupleId, { anniversary: date });
};

/**
 * Subscribe to couple data changes (real-time)
 * @param {string} coupleId 
 * @param {function} callback 
 * @returns {function} Unsubscribe function
 */
export const subscribeToCoupleUpdates = (coupleId, callback) => {
  const docRef = doc(db, COUPLES_COLLECTION, coupleId);
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() });
    }
  });
};

/**
 * Disconnect couple (break up)
 * @param {string} coupleId 
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const disconnectCouple = async (coupleId) => {
  try {
    const couple = await getCouple(coupleId);
    if (!couple) {
      return { success: false, error: 'Couple not found' };
    }
    
    const batch = writeBatch(db);
    
    // Remove couple reference from both users
    batch.update(doc(db, USERS_COLLECTION, couple.user1Id), {
      coupleId: null,
      partnerId: null,
      updatedAt: serverTimestamp(),
    });
    
    batch.update(doc(db, USERS_COLLECTION, couple.user2Id), {
      coupleId: null,
      partnerId: null,
      updatedAt: serverTimestamp(),
    });
    
    // Delete couple document
    batch.delete(doc(db, COUPLES_COLLECTION, coupleId));
    
    await batch.commit();
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error disconnecting couple:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Calculate days together
 * @param {object} couple 
 * @returns {number}
 */
export const calculateDaysTogether = (couple) => {
  if (!couple || !couple.connectedAt) return 0;
  
  const connectedDate = couple.connectedAt.toDate ? couple.connectedAt.toDate() : new Date(couple.connectedAt);
  const now = new Date();
  const diffTime = Math.abs(now - connectedDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};
