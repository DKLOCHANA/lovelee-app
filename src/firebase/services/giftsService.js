// Gifts Service - Handles gift sending between partners
import {
  doc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../config';
import { updateHearts } from './userService';

const GIFTS_COLLECTION = 'gifts';

/**
 * Send a gift to partner
 * @param {string} coupleId 
 * @param {string} senderId 
 * @param {string} receiverId 
 * @param {object} giftData - { giftId, emoji, label, hearts }
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const sendGift = async (coupleId, senderId, receiverId, giftData) => {
  try {
    // Check if sender has enough hearts
    const heartsResult = await updateHearts(senderId, -giftData.hearts);
    if (!heartsResult.success) {
      return { success: false, error: 'Not enough hearts' };
    }
    
    const gift = {
      coupleId,
      senderId,
      receiverId,
      giftId: giftData.giftId,
      emoji: giftData.emoji,
      label: giftData.label,
      hearts: giftData.hearts,
      message: giftData.message || null,
      isOpened: false,
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, GIFTS_COLLECTION), gift);
    
    // Add hearts to receiver (bonus hearts for receiving)
    await updateHearts(receiverId, Math.floor(giftData.hearts * 0.5));
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error sending gift:', error);
    // Refund hearts if gift failed
    await updateHearts(senderId, giftData.hearts);
    return { success: false, error: error.message };
  }
};

/**
 * Get all gifts for a couple
 * @param {string} coupleId 
 * @param {number} limitCount 
 * @returns {Promise<array>}
 */
export const getGifts = async (coupleId, limitCount = 50) => {
  try {
    const q = query(
      collection(db, GIFTS_COLLECTION),
      where('coupleId', '==', coupleId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting gifts:', error);
    return [];
  }
};

/**
 * Get sent gifts by user
 * @param {string} coupleId 
 * @param {string} userId 
 * @param {number} limitCount 
 * @returns {Promise<array>}
 */
export const getSentGifts = async (coupleId, userId, limitCount = 50) => {
  try {
    const q = query(
      collection(db, GIFTS_COLLECTION),
      where('coupleId', '==', coupleId),
      where('senderId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting sent gifts:', error);
    return [];
  }
};

/**
 * Get received gifts for user
 * @param {string} coupleId 
 * @param {string} userId 
 * @param {number} limitCount 
 * @returns {Promise<array>}
 */
export const getReceivedGifts = async (coupleId, userId, limitCount = 50) => {
  try {
    const q = query(
      collection(db, GIFTS_COLLECTION),
      where('coupleId', '==', coupleId),
      where('receiverId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting received gifts:', error);
    return [];
  }
};

/**
 * Subscribe to gifts (real-time)
 * @param {string} coupleId 
 * @param {function} callback 
 * @returns {function} Unsubscribe function
 */
export const subscribeToGifts = (coupleId, callback) => {
  const q = query(
    collection(db, GIFTS_COLLECTION),
    where('coupleId', '==', coupleId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const gifts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(gifts);
  });
};

/**
 * Get gift statistics for couple
 * @param {string} coupleId 
 * @returns {Promise<object>}
 */
export const getGiftStats = async (coupleId) => {
  try {
    const gifts = await getGifts(coupleId, 1000);
    
    const stats = {
      totalGifts: gifts.length,
      totalHeartsSpent: gifts.reduce((sum, g) => sum + g.hearts, 0),
      giftsByType: {},
    };
    
    gifts.forEach(gift => {
      if (!stats.giftsByType[gift.giftId]) {
        stats.giftsByType[gift.giftId] = {
          count: 0,
          emoji: gift.emoji,
          label: gift.label,
        };
      }
      stats.giftsByType[gift.giftId].count++;
    });
    
    return stats;
  } catch (error) {
    console.error('Error getting gift stats:', error);
    return { totalGifts: 0, totalHeartsSpent: 0, giftsByType: {} };
  }
};
