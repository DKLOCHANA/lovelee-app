// Zustand store for app state management
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// User store
export const useUserStore = create((set, get) => ({
  user: null,
  partner: null,
  isConnected: false,
  daysTogether: 0,
  hearts: 100,
  isPremium: false,
  
  setUser: (user) => set({ user }),
  setPartner: (partner) => set({ partner, isConnected: !!partner }),
  setDaysTogether: (days) => set({ daysTogether: days }),
  addHearts: (amount) => set((state) => ({ hearts: state.hearts + amount })),
  spendHearts: (amount) => set((state) => ({ 
    hearts: Math.max(0, state.hearts - amount) 
  })),
  setPremium: (status) => set({ isPremium: status }),
  
  // Initialize user from storage
  initUser: async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      const partnerData = await AsyncStorage.getItem('partner');
      const hearts = await AsyncStorage.getItem('hearts');
      
      if (userData) set({ user: JSON.parse(userData) });
      if (partnerData) set({ partner: JSON.parse(partnerData), isConnected: true });
      if (hearts) set({ hearts: parseInt(hearts, 10) });
    } catch (error) {
      console.log('Error loading user data:', error);
    }
  },
  
  // Save user data
  saveUser: async () => {
    try {
      const { user, partner, hearts } = get();
      if (user) await AsyncStorage.setItem('user', JSON.stringify(user));
      if (partner) await AsyncStorage.setItem('partner', JSON.stringify(partner));
      await AsyncStorage.setItem('hearts', hearts.toString());
    } catch (error) {
      console.log('Error saving user data:', error);
    }
  },
}));

// Mood store
export const useMoodStore = create((set) => ({
  currentMood: null,
  partnerMood: null,
  moodHistory: [],
  
  setMood: (mood) => set({ currentMood: mood }),
  setPartnerMood: (mood) => set({ partnerMood: mood }),
  addMoodToHistory: (mood) => set((state) => ({
    moodHistory: [{ ...mood, timestamp: new Date().toISOString() }, ...state.moodHistory].slice(0, 50)
  })),
}));

// Love Notes store
export const useNotesStore = create((set, get) => ({
  notes: [],
  sentNotes: [],
  receivedNotes: [],
  doodleCount: 0,
  lastDoodleDate: null,
  
  addNote: (note) => set((state) => ({
    notes: [{ ...note, id: Date.now().toString(), createdAt: new Date().toISOString() }, ...state.notes]
  })),
  
  sendNote: (note) => set((state) => ({
    sentNotes: [{ ...note, id: Date.now().toString(), sentAt: new Date().toISOString() }, ...state.sentNotes]
  })),
  
  receiveNote: (note) => set((state) => ({
    receivedNotes: [note, ...state.receivedNotes]
  })),
  
  deleteNote: (noteId) => set((state) => ({
    notes: state.notes.filter(n => n.id !== noteId),
    sentNotes: state.sentNotes.filter(n => n.id !== noteId),
    receivedNotes: state.receivedNotes.filter(n => n.id !== noteId),
  })),
  
  // Doodle limit tracking
  incrementDoodleCount: () => {
    const today = new Date().toDateString();
    const { lastDoodleDate, doodleCount } = get();
    
    if (lastDoodleDate !== today) {
      // Reset count for new day
      set({ doodleCount: 1, lastDoodleDate: today });
    } else {
      set({ doodleCount: doodleCount + 1 });
    }
  },
  
  canDoodle: () => {
    const today = new Date().toDateString();
    const { lastDoodleDate, doodleCount } = get();
    
    if (lastDoodleDate !== today) {
      return true; // New day, can doodle
    }
    return doodleCount < 2; // Can only doodle if count is less than 2
  },
  
  getDoodlesRemaining: () => {
    const today = new Date().toDateString();
    const { lastDoodleDate, doodleCount } = get();
    
    if (lastDoodleDate !== today) {
      return 2; // New day, 2 remaining
    }
    return Math.max(0, 2 - doodleCount);
  },
}));

// Pet store
export const usePetStore = create((set) => ({
  petName: 'Piggy',
  petSkin: 'piggy',
  petHappiness: 80,
  petHunger: 50,
  lastFed: null,
  lastPlayed: null,
  
  setPetName: (name) => set({ petName: name }),
  setPetSkin: (skin) => set({ petSkin: skin }),
  
  feedPet: () => set((state) => ({
    petHunger: Math.min(100, state.petHunger + 20),
    petHappiness: Math.min(100, state.petHappiness + 5),
    lastFed: new Date().toISOString(),
  })),
  
  playWithPet: () => set((state) => ({
    petHappiness: Math.min(100, state.petHappiness + 15),
    petHunger: Math.max(0, state.petHunger - 5),
    lastPlayed: new Date().toISOString(),
  })),
  
  decreaseStats: () => set((state) => ({
    petHunger: Math.max(0, state.petHunger - 1),
    petHappiness: Math.max(0, state.petHappiness - 1),
  })),
}));

// Love Zone / Room store
export const useRoomStore = create((set) => ({
  unlockedItems: [],
  placedItems: [],
  loveZoneLevel: 1,
  
  unlockItem: (item) => set((state) => ({
    unlockedItems: [...state.unlockedItems, item]
  })),
  
  placeItem: (item, position) => set((state) => ({
    placedItems: [...state.placedItems, { ...item, position }]
  })),
  
  removeItem: (itemId) => set((state) => ({
    placedItems: state.placedItems.filter(i => i.id !== itemId)
  })),
  
  levelUp: () => set((state) => ({
    loveZoneLevel: state.loveZoneLevel + 1
  })),
}));

// Gifts store
export const useGiftsStore = create((set) => ({
  sentGifts: [],
  receivedGifts: [],
  
  sendGift: (gift) => set((state) => ({
    sentGifts: [{ ...gift, sentAt: new Date().toISOString() }, ...state.sentGifts]
  })),
  
  receiveGift: (gift) => set((state) => ({
    receivedGifts: [gift, ...state.receivedGifts]
  })),
}));

// Activity/Notification store
export const useActivityStore = create((set, get) => ({
  lastCheckedTime: null,
  newNotificationCount: 0,
  
  // Mark activity as checked (when user visits Activity page)
  markAsChecked: async () => {
    const now = new Date().toISOString();
    set({ lastCheckedTime: now, newNotificationCount: 0 });
    try {
      await AsyncStorage.setItem('lastActivityChecked', now);
    } catch (error) {
      console.log('Error saving last checked time:', error);
    }
  },
  
  // Add new notification (increases badge count)
  addNotification: () => set((state) => ({
    newNotificationCount: state.newNotificationCount + 1
  })),
  
  // Set notification count directly
  setNotificationCount: (count) => set({ newNotificationCount: count }),
  
  // Initialize from storage
  initActivity: async () => {
    try {
      const lastChecked = await AsyncStorage.getItem('lastActivityChecked');
      if (lastChecked) {
        // User has visited activity before, no new notifications
        set({ lastCheckedTime: lastChecked, newNotificationCount: 0 });
      }
      // If no lastChecked, keep count at 0 - the welcome notification
      // will be handled by the Activity page checking Firebase
    } catch (error) {
      console.log('Error loading activity data:', error);
    }
  },
}));
