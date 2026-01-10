// Firebase Auth Context Provider
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChange } from './services/authService';
import { getUserProfile } from './services/userService';
import { getCouple, calculateDaysTogether } from './services/coupleService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [partner, setPartner] = useState(null);
  const [couple, setCouple] = useState(null);
  const [loading, setLoading] = useState(true);
  const [daysTogether, setDaysTogether] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // Get user profile
          const userProfile = await getUserProfile(firebaseUser.uid);
          setProfile(userProfile);
          
          // Get couple and partner data if connected
          if (userProfile?.coupleId) {
            const coupleData = await getCouple(userProfile.coupleId);
            setCouple(coupleData);
            setDaysTogether(calculateDaysTogether(coupleData));
            
            if (userProfile.partnerId) {
              const partnerProfile = await getUserProfile(userProfile.partnerId);
              setPartner(partnerProfile);
            }
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      } else {
        setProfile(null);
        setPartner(null);
        setCouple(null);
        setDaysTogether(0);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Refresh user data
  const refreshUser = async () => {
    if (!user) return;
    
    try {
      const userProfile = await getUserProfile(user.uid);
      setProfile(userProfile);
      
      if (userProfile?.coupleId) {
        const coupleData = await getCouple(userProfile.coupleId);
        setCouple(coupleData);
        setDaysTogether(calculateDaysTogether(coupleData));
        
        if (userProfile.partnerId) {
          const partnerProfile = await getUserProfile(userProfile.partnerId);
          setPartner(partnerProfile);
        }
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  const value = {
    user,
    profile,
    partner,
    couple,
    loading,
    daysTogether,
    isAuthenticated: !!user,
    isConnected: !!profile?.coupleId,
    isPremium: profile?.isPremium || false,
    hearts: profile?.hearts || 0,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useFirebaseAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useFirebaseAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
