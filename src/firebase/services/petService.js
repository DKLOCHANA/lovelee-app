// Pet Service - Handles shared pet data
import {
  doc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  increment,
} from 'firebase/firestore';
import { db } from '../config';
import { getCouple, updateCouple } from './coupleService';

/**
 * Update pet data in couple document
 * @param {string} coupleId 
 * @param {object} petData 
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const updatePet = async (coupleId, petData) => {
  try {
    const couple = await getCouple(coupleId);
    if (!couple) {
      return { success: false, error: 'Couple not found' };
    }
    
    const updatedPet = {
      ...couple.pet,
      ...petData,
    };
    
    return await updateCouple(coupleId, { pet: updatedPet });
  } catch (error) {
    console.error('Error updating pet:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get pet data
 * @param {string} coupleId 
 * @returns {Promise<object|null>}
 */
export const getPet = async (coupleId) => {
  try {
    const couple = await getCouple(coupleId);
    return couple?.pet || null;
  } catch (error) {
    console.error('Error getting pet:', error);
    return null;
  }
};

/**
 * Update pet name
 * @param {string} coupleId 
 * @param {string} name 
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const updatePetName = async (coupleId, name) => {
  return updatePet(coupleId, { name });
};

/**
 * Update pet skin
 * @param {string} coupleId 
 * @param {string} skin 
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const updatePetSkin = async (coupleId, skin) => {
  return updatePet(coupleId, { skin });
};

/**
 * Feed pet
 * @param {string} coupleId 
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const feedPet = async (coupleId) => {
  try {
    const couple = await getCouple(coupleId);
    if (!couple || !couple.pet) {
      return { success: false, error: 'Pet not found' };
    }
    
    const updatedPet = {
      ...couple.pet,
      hunger: Math.min(100, (couple.pet.hunger || 50) + 20),
      happiness: Math.min(100, (couple.pet.happiness || 50) + 5),
      lastFed: serverTimestamp(),
    };
    
    return await updateCouple(coupleId, { pet: updatedPet });
  } catch (error) {
    console.error('Error feeding pet:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Play with pet
 * @param {string} coupleId 
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const playWithPet = async (coupleId) => {
  try {
    const couple = await getCouple(coupleId);
    if (!couple || !couple.pet) {
      return { success: false, error: 'Pet not found' };
    }
    
    const updatedPet = {
      ...couple.pet,
      happiness: Math.min(100, (couple.pet.happiness || 50) + 15),
      hunger: Math.max(0, (couple.pet.hunger || 50) - 5),
      lastPlayed: serverTimestamp(),
    };
    
    return await updateCouple(coupleId, { pet: updatedPet });
  } catch (error) {
    console.error('Error playing with pet:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Bathe pet (premium)
 * @param {string} coupleId 
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const bathePet = async (coupleId) => {
  try {
    const couple = await getCouple(coupleId);
    if (!couple || !couple.pet) {
      return { success: false, error: 'Pet not found' };
    }
    
    const updatedPet = {
      ...couple.pet,
      happiness: Math.min(100, (couple.pet.happiness || 50) + 10),
      lastBathed: serverTimestamp(),
    };
    
    return await updateCouple(coupleId, { pet: updatedPet });
  } catch (error) {
    console.error('Error bathing pet:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Put pet to sleep (premium)
 * @param {string} coupleId 
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const sleepPet = async (coupleId) => {
  try {
    const couple = await getCouple(coupleId);
    if (!couple || !couple.pet) {
      return { success: false, error: 'Pet not found' };
    }
    
    const updatedPet = {
      ...couple.pet,
      happiness: Math.min(100, (couple.pet.happiness || 50) + 8),
      lastSlept: serverTimestamp(),
    };
    
    return await updateCouple(coupleId, { pet: updatedPet });
  } catch (error) {
    console.error('Error putting pet to sleep:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Subscribe to pet updates (real-time)
 * @param {string} coupleId 
 * @param {function} callback 
 * @returns {function} Unsubscribe function
 */
export const subscribeToPetUpdates = (coupleId, callback) => {
  const docRef = doc(db, 'couples', coupleId);
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data().pet);
    }
  });
};

/**
 * Decrease pet stats over time (called periodically)
 * @param {string} coupleId 
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const decreasePetStats = async (coupleId) => {
  try {
    const couple = await getCouple(coupleId);
    if (!couple || !couple.pet) {
      return { success: false, error: 'Pet not found' };
    }
    
    const updatedPet = {
      ...couple.pet,
      happiness: Math.max(0, (couple.pet.happiness || 50) - 1),
      hunger: Math.max(0, (couple.pet.hunger || 50) - 1),
    };
    
    return await updateCouple(coupleId, { pet: updatedPet });
  } catch (error) {
    console.error('Error decreasing pet stats:', error);
    return { success: false, error: error.message };
  }
};
