// Authentication Service
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
  deleteUser,
} from 'firebase/auth';
import { auth } from '../config';
import { createUserProfile, getUserProfile, deleteUserAccount } from './userService';

/**
 * Register a new user with email and password
 * @param {string} email 
 * @param {string} password 
 * @param {string} displayName 
 * @returns {Promise<{user: object, error: string|null}>}
 */
export const registerWithEmail = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update display name
    await updateProfile(user, { displayName });

    // Create user profile in Firestore
    await createUserProfile(user.uid, {
      email: user.email,
      displayName,
    });

    return { user, error: null };
  } catch (error) {
    return { user: null, error: getAuthErrorMessage(error.code) };
  }
};

/**
 * Sign in with email and password
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{user: object, error: string|null}>}
 */
export const loginWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: getAuthErrorMessage(error.code) };
  }
};

/**
 * Sign in with Google credential (for Expo)
 * @param {string} idToken - Google ID token
 * @returns {Promise<{user: object, error: string|null}>}
 */
export const loginWithGoogle = async (idToken) => {
  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);
    const user = userCredential.user;

    // Check if user profile exists, if not create one
    const profile = await getUserProfile(user.uid);
    if (!profile) {
      await createUserProfile(user.uid, {
        email: user.email,
        displayName: user.displayName || 'User',
        photoURL: user.photoURL,
      });
    }

    return { user, error: null };
  } catch (error) {
    return { user: null, error: getAuthErrorMessage(error.code) };
  }
};

/**
 * Sign out the current user
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const logout = async () => {
  try {
    await signOut(auth);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Delete user account completely (Firebase Auth + Firestore data)
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const deleteAccount = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'No user logged in' };
    }
    
    // First delete Firestore user data
    const deleteResult = await deleteUserAccount(user.uid);
    if (!deleteResult.success) {
      console.warn('Failed to delete user data:', deleteResult.error);
      // Continue with auth deletion anyway
    }
    
    // Then delete the Firebase Auth user
    await deleteUser(user);
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting account:', error);
    // Handle re-authentication requirement
    if (error.code === 'auth/requires-recent-login') {
      return { 
        success: false, 
        error: 'For security, please log out and log back in, then try deleting your account again.' 
      };
    }
    return { success: false, error: error.message || 'Failed to delete account' };
  }
};

/**
 * Send password reset email
 * @param {string} email 
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: getAuthErrorMessage(error.code) };
  }
};

/**
 * Get current authenticated user
 * @returns {object|null}
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Subscribe to auth state changes
 * @param {function} callback 
 * @returns {function} Unsubscribe function
 */
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Convert Firebase auth error codes to user-friendly messages
 * @param {string} errorCode 
 * @returns {string}
 */
const getAuthErrorMessage = (errorCode) => {
  const errorMessages = {
    'auth/email-already-in-use': 'This email is already registered',
    'auth/invalid-email': 'Please enter a valid email address',
    'auth/operation-not-allowed': 'Operation not allowed',
    'auth/weak-password': 'Password is too weak. Use at least 6 characters',
    'auth/user-disabled': 'This account has been disabled',
    'auth/user-not-found': 'No account found with this email',
    'auth/wrong-password': 'Incorrect password. Please try again',
    'auth/invalid-credential': 'Incorrect email or password. Please check your credentials',
    'auth/invalid-login-credentials': 'Incorrect email or password. Please check your credentials',
    'auth/missing-password': 'Please enter your password',
    'auth/missing-email': 'Please enter your email address',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later',
    'auth/network-request-failed': 'Network error. Please check your connection',
    'auth/requires-recent-login': 'Please log in again to perform this action',
  };
  return errorMessages[errorCode] || 'An error occurred. Please try again';
};
