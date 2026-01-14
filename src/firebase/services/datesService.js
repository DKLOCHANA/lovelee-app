// Special Dates Service - Handles important dates storage
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  onSnapshot,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config';

const DATES_COLLECTION = 'specialDates';

/**
 * Save anniversary date for a couple
 * @param {string} coupleId 
 * @param {Date} date 
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const saveAnniversaryDate = async (coupleId, date) => {
  try {
    const docRef = doc(db, DATES_COLLECTION, `${coupleId}_anniversary`);
    await setDoc(docRef, {
      coupleId,
      type: 'anniversary',
      title: 'Anniversary Date',
      date: date.toISOString(),
      isAnniversary: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error saving anniversary date:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get anniversary date for a couple
 * @param {string} coupleId 
 * @returns {Promise<{date: Date|null, error: string|null}>}
 */
export const getAnniversaryDate = async (coupleId) => {
  try {
    const docRef = doc(db, DATES_COLLECTION, `${coupleId}_anniversary`);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return { date: new Date(data.date), error: null };
    }
    return { date: null, error: null };
  } catch (error) {
    console.error('Error getting anniversary date:', error);
    return { date: null, error: error.message };
  }
};

/**
 * Add a new important date
 * @param {string} coupleId 
 * @param {object} dateData - { title, date, note }
 * @returns {Promise<{success: boolean, id: string|null, error: string|null}>}
 */
export const addImportantDate = async (coupleId, dateData) => {
  try {
    const docRef = await addDoc(collection(db, DATES_COLLECTION), {
      coupleId,
      type: 'custom',
      title: dateData.title,
      date: dateData.date.toISOString(),
      note: dateData.note || '',
      isAnniversary: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return { success: true, id: docRef.id, error: null };
  } catch (error) {
    console.error('Error adding important date:', error);
    return { success: false, id: null, error: error.message };
  }
};

/**
 * Update an important date
 * @param {string} dateId 
 * @param {object} updates 
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const updateImportantDate = async (dateId, updates) => {
  try {
    const docRef = doc(db, DATES_COLLECTION, dateId);
    await updateDoc(docRef, {
      ...updates,
      date: updates.date ? updates.date.toISOString() : undefined,
      updatedAt: serverTimestamp(),
    });
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating important date:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete an important date
 * @param {string} dateId 
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const deleteImportantDate = async (dateId) => {
  try {
    const docRef = doc(db, DATES_COLLECTION, dateId);
    await deleteDoc(docRef);
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting important date:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all important dates for a couple
 * @param {string} coupleId 
 * @returns {Promise<{dates: array, error: string|null}>}
 */
export const getImportantDates = async (coupleId) => {
  try {
    const q = query(
      collection(db, DATES_COLLECTION),
      where('coupleId', '==', coupleId),
      where('isAnniversary', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    const dates = [];
    
    querySnapshot.forEach((doc) => {
      dates.push({
        id: doc.id,
        ...doc.data(),
        date: new Date(doc.data().date),
      });
    });
    
    // Sort by date
    dates.sort((a, b) => a.date - b.date);
    
    return { dates, error: null };
  } catch (error) {
    console.error('Error getting important dates:', error);
    return { dates: [], error: error.message };
  }
};

/**
 * Subscribe to important dates changes
 * @param {string} coupleId 
 * @param {function} callback 
 * @returns {function} unsubscribe
 */
export const subscribeToImportantDates = (coupleId, callback) => {
  const q = query(
    collection(db, DATES_COLLECTION),
    where('coupleId', '==', coupleId)
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const dates = [];
    const anniversary = null;
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.isAnniversary) {
        callback({
          anniversary: { id: doc.id, ...data, date: new Date(data.date) },
          dates: dates,
        });
      } else {
        dates.push({
          id: doc.id,
          ...data,
          date: new Date(data.date),
        });
      }
    });
    
    // Sort by date
    dates.sort((a, b) => a.date - b.date);
    
    callback({ anniversary, dates });
  });
};

/**
 * Calculate days until a date (for countdowns)
 * @param {Date} date 
 * @returns {number}
 */
export const getDaysUntil = (date) => {
  const now = new Date();
  const targetDate = new Date(date);
  
  // Set to same year for recurring dates
  targetDate.setFullYear(now.getFullYear());
  
  // If date has passed this year, set to next year
  if (targetDate < now) {
    targetDate.setFullYear(now.getFullYear() + 1);
  }
  
  const diffTime = targetDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Calculate years since anniversary
 * @param {Date} date 
 * @returns {number}
 */
export const getYearsTogether = (date) => {
  const now = new Date();
  const anniversary = new Date(date);
  
  let years = now.getFullYear() - anniversary.getFullYear();
  const monthDiff = now.getMonth() - anniversary.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < anniversary.getDate())) {
    years--;
  }
  
  return Math.max(0, years);
};
