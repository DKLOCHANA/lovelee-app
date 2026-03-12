// Hook for syncing pet data between Zustand store and Firebase
import { useEffect } from 'react';
import { usePetStore } from '../store/store';
import { auth } from '../firebase/config';
import { getUserProfile } from '../firebase/services/userService';
import { subscribeToCoupleUpdates } from '../firebase/services/coupleService';
import { feedPet as firebaseFeedPet, playWithPet as firebasePlayWithPet, updatePet } from '../firebase/services/petService';

export const usePet = () => {
  const petName = usePetStore((state) => state.petName);
  const petSkin = usePetStore((state) => state.petSkin);
  const petHappiness = usePetStore((state) => state.petHappiness);
  const petHunger = usePetStore((state) => state.petHunger);
  const petLoaded = usePetStore((state) => state.petLoaded);
  const syncFromFirebase = usePetStore((state) => state.syncFromFirebase);
  const initPetFromFirebase = usePetStore((state) => state.initPetFromFirebase);
  const localFeedPet = usePetStore((state) => state.feedPet);
  const localPlayWithPet = usePetStore((state) => state.playWithPet);

  // Subscribe to real-time pet data updates from Firebase
  useEffect(() => {
    let unsubscribe = null;

    const setupSubscription = async () => {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const profile = await getUserProfile(userId);
      if (!profile?.coupleId) return;

      // Subscribe to couple updates (pet data is in couple document)
      unsubscribe = subscribeToCoupleUpdates(profile.coupleId, (coupleData) => {
        if (coupleData?.pet) {
          if (!petLoaded) {
            initPetFromFirebase(coupleData.pet);
          } else {
            syncFromFirebase(coupleData.pet);
          }
        }
      });
    };

    setupSubscription();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [petLoaded, initPetFromFirebase, syncFromFirebase]);

  // Feed pet - updates both local store and Firebase
  const feedPet = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return { success: false, error: 'Not authenticated' };

    // Update local store immediately for responsive UI
    localFeedPet();

    // Get couple ID
    const profile = await getUserProfile(userId);
    if (!profile?.coupleId) return { success: false, error: 'Not connected' };

    // Update Firebase
    const result = await firebaseFeedPet(profile.coupleId);
    return result;
  };

  // Play with pet - updates both local store and Firebase
  const playWithPet = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return { success: false, error: 'Not authenticated' };

    // Update local store immediately for responsive UI
    localPlayWithPet();

    // Get couple ID
    const profile = await getUserProfile(userId);
    if (!profile?.coupleId) return { success: false, error: 'Not connected' };

    // Update Firebase
    const result = await firebasePlayWithPet(profile.coupleId);
    return result;
  };

  // Update pet name
  const updatePetName = async (name) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return { success: false, error: 'Not authenticated' };

    const profile = await getUserProfile(userId);
    if (!profile?.coupleId) return { success: false, error: 'Not connected' };

    return await updatePet(profile.coupleId, { name });
  };

  // Update pet skin
  const updatePetSkin = async (skin) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return { success: false, error: 'Not authenticated' };

    const profile = await getUserProfile(userId);
    if (!profile?.coupleId) return { success: false, error: 'Not connected' };

    return await updatePet(profile.coupleId, { skin });
  };

  return {
    petName,
    petSkin,
    petHappiness,
    petHunger,
    petLoaded,
    feedPet,
    playWithPet,
    updatePetName,
    updatePetSkin,
  };
};
