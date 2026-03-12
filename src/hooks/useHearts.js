// Hearts Hook - Syncs hearts between local store and Firebase
import { useCallback } from 'react';
import { useUserStore } from '../store/store';
import { updateHearts } from '../firebase/services/userService';
import { auth } from '../firebase/config';

/**
 * Hook for managing hearts with Firebase sync
 * Use this instead of directly calling useUserStore for hearts operations
 */
export const useHearts = () => {
  const hearts = useUserStore((state) => state.hearts);
  const setHearts = useUserStore((state) => state.setHearts);
  const localAddHearts = useUserStore((state) => state.addHearts);
  const localSpendHearts = useUserStore((state) => state.spendHearts);

  /**
   * Add hearts and sync with Firebase
   * @param {number} amount - Amount to add
   * @returns {Promise<{success: boolean, newBalance: number}>}
   */
  const addHearts = useCallback(async (amount) => {
    // Update local state immediately for responsive UI
    const newLocalBalance = localAddHearts(amount);
    
    // Sync with Firebase
    if (auth.currentUser) {
      const result = await updateHearts(auth.currentUser.uid, amount);
      if (result.success) {
        // Sync with Firebase value (in case of discrepancy)
        setHearts(result.newBalance);
        return { success: true, newBalance: result.newBalance };
      }
    }
    
    return { success: true, newBalance: newLocalBalance };
  }, [localAddHearts, setHearts]);

  /**
   * Spend hearts and sync with Firebase
   * @param {number} amount - Amount to spend
   * @returns {Promise<{success: boolean, newBalance: number}>}
   */
  const spendHearts = useCallback(async (amount) => {
    // Check if user has enough hearts
    if (hearts < amount) {
      return { success: false, newBalance: hearts, error: 'Not enough hearts' };
    }
    
    // Update local state immediately for responsive UI
    const newLocalBalance = localSpendHearts(amount);
    
    // Sync with Firebase (negative amount to subtract)
    if (auth.currentUser) {
      const result = await updateHearts(auth.currentUser.uid, -amount);
      if (result.success) {
        // Sync with Firebase value
        setHearts(result.newBalance);
        return { success: true, newBalance: result.newBalance };
      }
    }
    
    return { success: true, newBalance: newLocalBalance };
  }, [hearts, localSpendHearts, setHearts]);

  /**
   * Check if user can afford an amount
   * @param {number} amount
   * @returns {boolean}
   */
  const canAfford = useCallback((amount) => {
    return hearts >= amount;
  }, [hearts]);

  return {
    hearts,
    addHearts,
    spendHearts,
    canAfford,
    setHearts,
  };
};

export default useHearts;
