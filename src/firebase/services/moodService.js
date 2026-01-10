// Mood Service - Handles mood tracking and check-ins
import {
  doc,
  collection,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../config';

const MOODS_COLLECTION = 'moods';

/**
 * Set current mood
 * @param {string} coupleId 
 * @param {string} userId 
 * @param {object} moodData - { moodId, emoji, label, note? }
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const setMood = async (coupleId, userId, moodData) => {
  try {
    const mood = {
      coupleId,
      userId,
      moodId: moodData.moodId,
      emoji: moodData.emoji,
      label: moodData.label,
      note: moodData.note || null,
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, MOODS_COLLECTION), mood);
    return { success: true, error: null };
  } catch (error) {
    console.error('Error setting mood:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get current mood for a user (most recent)
 * @param {string} coupleId 
 * @param {string} userId 
 * @returns {Promise<object|null>}
 */
export const getCurrentMood = async (coupleId, userId) => {
  try {
    const q = query(
      collection(db, MOODS_COLLECTION),
      where('coupleId', '==', coupleId),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting current mood:', error);
    return null;
  }
};

/**
 * Get partner's current mood
 * @param {string} coupleId 
 * @param {string} partnerId 
 * @returns {Promise<object|null>}
 */
export const getPartnerMood = async (coupleId, partnerId) => {
  return getCurrentMood(coupleId, partnerId);
};

/**
 * Get both users' current moods
 * @param {string} coupleId 
 * @param {string} userId 
 * @param {string} partnerId 
 * @returns {Promise<{userMood: object|null, partnerMood: object|null}>}
 */
export const getBothMoods = async (coupleId, userId, partnerId) => {
  const [userMood, partnerMood] = await Promise.all([
    getCurrentMood(coupleId, userId),
    getCurrentMood(coupleId, partnerId),
  ]);
  
  return { userMood, partnerMood };
};

/**
 * Get mood history for a user
 * @param {string} coupleId 
 * @param {string} userId 
 * @param {number} limitCount 
 * @returns {Promise<array>}
 */
export const getMoodHistory = async (coupleId, userId, limitCount = 30) => {
  try {
    const q = query(
      collection(db, MOODS_COLLECTION),
      where('coupleId', '==', coupleId),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting mood history:', error);
    return [];
  }
};

/**
 * Get couple's mood history (combined)
 * @param {string} coupleId 
 * @param {number} limitCount 
 * @returns {Promise<array>}
 */
export const getCoupleMoodHistory = async (coupleId, limitCount = 50) => {
  try {
    const q = query(
      collection(db, MOODS_COLLECTION),
      where('coupleId', '==', coupleId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting couple mood history:', error);
    return [];
  }
};

/**
 * Subscribe to mood updates (real-time)
 * @param {string} coupleId 
 * @param {function} callback 
 * @returns {function} Unsubscribe function
 */
export const subscribeToMoods = (coupleId, callback) => {
  const q = query(
    collection(db, MOODS_COLLECTION),
    where('coupleId', '==', coupleId),
    orderBy('createdAt', 'desc'),
    limit(10)
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const moods = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(moods);
  });
};

/**
 * Get mood statistics for a user
 * @param {string} coupleId 
 * @param {string} userId 
 * @returns {Promise<object>}
 */
export const getMoodStats = async (coupleId, userId) => {
  try {
    const moods = await getMoodHistory(coupleId, userId, 100);
    
    const stats = {
      totalCheckIns: moods.length,
      moodCounts: {},
      mostFrequentMood: null,
    };
    
    moods.forEach(mood => {
      if (!stats.moodCounts[mood.moodId]) {
        stats.moodCounts[mood.moodId] = {
          count: 0,
          emoji: mood.emoji,
          label: mood.label,
        };
      }
      stats.moodCounts[mood.moodId].count++;
    });
    
    // Find most frequent mood
    let maxCount = 0;
    Object.entries(stats.moodCounts).forEach(([moodId, data]) => {
      if (data.count > maxCount) {
        maxCount = data.count;
        stats.mostFrequentMood = { moodId, ...data };
      }
    });
    
    return stats;
  } catch (error) {
    console.error('Error getting mood stats:', error);
    return { totalCheckIns: 0, moodCounts: {}, mostFrequentMood: null };
  }
};

/**
 * Get today's mood check-in count for user
 * @param {string} coupleId 
 * @param {string} userId 
 * @returns {Promise<number>}
 */
export const getTodayMoodCount = async (coupleId, userId) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const moods = await getMoodHistory(coupleId, userId, 20);
    
    return moods.filter(mood => {
      const moodDate = mood.createdAt?.toDate ? mood.createdAt.toDate() : new Date(mood.createdAt);
      return moodDate >= today;
    }).length;
  } catch (error) {
    console.error('Error getting today mood count:', error);
    return 0;
  }
};
