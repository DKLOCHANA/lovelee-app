// Custom hooks for Firebase
import { useState, useEffect } from 'react';
import { onAuthStateChange } from '../services/authService';
import { getUserProfile } from '../services/userService';
import { getCouple, subscribeToCoupleUpdates, calculateDaysTogether } from '../services/coupleService';

/**
 * Hook to track authentication state
 * @returns {object} { user, profile, loading }
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        const userProfile = await getUserProfile(firebaseUser.uid);
        setProfile(userProfile);
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, profile, loading };
};

/**
 * Hook to get and subscribe to couple data
 * @param {string} coupleId 
 * @returns {object} { couple, loading, daysTogether }
 */
export const useCouple = (coupleId) => {
  const [couple, setCouple] = useState(null);
  const [loading, setLoading] = useState(true);
  const [daysTogether, setDaysTogether] = useState(0);

  useEffect(() => {
    if (!coupleId) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToCoupleUpdates(coupleId, (coupleData) => {
      setCouple(coupleData);
      setDaysTogether(calculateDaysTogether(coupleData));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [coupleId]);

  return { couple, loading, daysTogether };
};

/**
 * Hook to get partner profile
 * @param {string} partnerId 
 * @returns {object} { partner, loading }
 */
export const usePartner = (partnerId) => {
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPartner = async () => {
      if (!partnerId) {
        setLoading(false);
        return;
      }

      const partnerProfile = await getUserProfile(partnerId);
      setPartner(partnerProfile);
      setLoading(false);
    };

    fetchPartner();
  }, [partnerId]);

  return { partner, loading };
};
