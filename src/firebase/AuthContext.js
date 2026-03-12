// Firebase Auth Context Provider
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { onAuthStateChange } from './services/authService';
import { getUserProfile, subscribeToUserProfile } from './services/userService';
import { getCouple, calculateDaysTogether, subscribeToCoupleUpdates } from './services/coupleService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [partner, setPartner] = useState(null);
  const [couple, setCouple] = useState(null);
  const [loading, setLoading] = useState(true);
  const [daysTogether, setDaysTogether] = useState(0);
  
  // Keep track of subscription cleanup functions
  const subscriptionsRef = useRef([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      // Clean up any existing subscriptions
      subscriptionsRef.current.forEach(unsub => unsub());
      subscriptionsRef.current = [];
      
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // Get user profile
          const userProfile = await getUserProfile(firebaseUser.uid);
          setProfile(userProfile);
          
          // Subscribe to current user's profile updates
          const unsubProfile = subscribeToUserProfile(firebaseUser.uid, (updatedProfile) => {
            if (updatedProfile) {
              setProfile(updatedProfile);
            }
          });
          subscriptionsRef.current.push(unsubProfile);
          
          // Get couple and partner data if connected
          if (userProfile?.coupleId) {
            const coupleData = await getCouple(userProfile.coupleId);
            setCouple(coupleData);
            setDaysTogether(calculateDaysTogether(coupleData));
            
            // Subscribe to couple updates (real-time)
            const unsubCouple = subscribeToCoupleUpdates(userProfile.coupleId, (updatedCouple) => {
              if (updatedCouple) {
                setCouple(updatedCouple);
                setDaysTogether(calculateDaysTogether(updatedCouple));
              }
            });
            subscriptionsRef.current.push(unsubCouple);
            
            if (userProfile.partnerId) {
              const partnerProfile = await getUserProfile(userProfile.partnerId);
              setPartner(partnerProfile);
              
              // Subscribe to partner profile updates (real-time)
              const unsubPartner = subscribeToUserProfile(userProfile.partnerId, (updatedPartner) => {
                setPartner(updatedPartner);
              });
              subscriptionsRef.current.push(unsubPartner);
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

    return () => {
      unsubscribe();
      // Clean up all subscriptions on unmount
      subscriptionsRef.current.forEach(unsub => unsub());
    };
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
