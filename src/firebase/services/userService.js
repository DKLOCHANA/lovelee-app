// User Service - Handles user profile operations
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config';

const USERS_COLLECTION = 'users';

/**
 * Generate a unique 6-character invite code
 * @returns {string}
 */
const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

/**
 * Create a new user profile in Firestore
 * @param {string} userId 
 * @param {object} userData 
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const createUserProfile = async (userId, userData) => {
  try {
    const inviteCode = generateInviteCode();
    
    const userProfile = {
      uid: userId,
      email: userData.email,
      displayName: userData.displayName || 'User',
      photoURL: userData.photoURL || null,
      inviteCode,
      coupleId: null,
      partnerId: null,
      isPremium: false,
      premiumExpiry: null,
      hearts: 100,
      welcomeNotificationShown: false, // Track if welcome notification has been shown
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      settings: {
        notifications: true,
        soundEnabled: true,
        theme: 'light',
      },
    };

    await setDoc(doc(db, USERS_COLLECTION, userId), userProfile);
    return { success: true, data: userProfile, error: null };
  } catch (error) {
    console.error('Error creating user profile:', error);
    return { success: false, data: null, error: error.message };
  }
};

/**
 * Get user profile by ID
 * @param {string} userId 
 * @returns {Promise<object|null>}
 */
export const getUserProfile = async (userId) => {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

/**
 * Get user by invite code
 * @param {string} inviteCode 
 * @returns {Promise<object|null>}
 */
export const getUserByInviteCode = async (inviteCode) => {
  try {
    const q = query(
      collection(db, USERS_COLLECTION),
      where('inviteCode', '==', inviteCode.toUpperCase())
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error finding user by invite code:', error);
    return null;
  }
};

/**
 * Update user profile
 * @param {string} userId 
 * @param {object} updates 
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update user's display name
 * @param {string} userId 
 * @param {string} displayName 
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const updateDisplayName = async (userId, displayName) => {
  return updateUserProfile(userId, { displayName });
};

/**
 * Upload user profile photo
 * @param {string} userId 
 * @param {string} imageUri 
 * @returns {Promise<{success: boolean, url: string|null, error: string|null}>}
 */
export const uploadProfilePhoto = async (userId, imageUri) => {
  try {
    // Create a reference to the file
    const imageRef = ref(storage, `profilePhotos/${userId}`);
    
    // Fetch the image and convert to blob
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    // Upload the file
    await uploadBytes(imageRef, blob);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(imageRef);
    
    // Update user profile with new photo URL
    await updateUserProfile(userId, { photoURL: downloadURL });
    
    return { success: true, url: downloadURL, error: null };
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    return { success: false, url: null, error: error.message };
  }
};

/**
 * Delete user profile photo
 * @param {string} userId 
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const deleteProfilePhoto = async (userId) => {
  try {
    const imageRef = ref(storage, `profilePhotos/${userId}`);
    await deleteObject(imageRef);
    await updateUserProfile(userId, { photoURL: null });
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting profile photo:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update user hearts
 * @param {string} userId 
 * @param {number} amount - Positive to add, negative to subtract
 * @returns {Promise<{success: boolean, newBalance: number, error: string|null}>}
 */
export const updateHearts = async (userId, amount) => {
  try {
    const profile = await getUserProfile(userId);
    if (!profile) throw new Error('User not found');
    
    const newBalance = Math.max(0, (profile.hearts || 0) + amount);
    await updateUserProfile(userId, { hearts: newBalance });
    
    return { success: true, newBalance, error: null };
  } catch (error) {
    console.error('Error updating hearts:', error);
    return { success: false, newBalance: 0, error: error.message };
  }
};

/**
 * Update user premium status
 * @param {string} userId 
 * @param {boolean} isPremium 
 * @param {Date|null} expiry 
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const updatePremiumStatus = async (userId, isPremium, expiry = null) => {
  return updateUserProfile(userId, { 
    isPremium, 
    premiumExpiry: expiry 
  });
};

/**
 * Update user settings
 * @param {string} userId 
 * @param {object} settings 
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const updateUserSettings = async (userId, settings) => {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(docRef, {
      settings,
      updatedAt: serverTimestamp(),
    });
    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating user settings:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete user account
 * @param {string} userId 
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const deleteUserAccount = async (userId) => {
  try {
    // Delete profile photo if exists
    try {
      await deleteProfilePhoto(userId);
    } catch (e) {
      // Ignore if no photo exists
    }
    
    // Delete user document
    await deleteDoc(doc(db, USERS_COLLECTION, userId));
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting user account:', error);
    return { success: false, error: error.message };
  }
};
