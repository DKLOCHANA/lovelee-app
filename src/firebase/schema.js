// Firestore Database Structure Documentation
// This file documents the database schema for the Pairly app

/*
===========================================
FIRESTORE COLLECTIONS STRUCTURE
===========================================

1. USERS COLLECTION (/users/{userId})
-------------------------------------------
{
  uid: string,                    // Firebase Auth UID
  email: string,                  // User email
  displayName: string,            // User's display name
  photoURL: string | null,        // Profile photo URL
  inviteCode: string,             // Unique 6-char code for partner connection
  coupleId: string | null,        // Reference to couple document
  partnerId: string | null,       // Partner's user ID
  isPremium: boolean,             // Premium subscription status
  premiumExpiry: timestamp | null,// Premium expiration date
  hearts: number,                 // In-app currency
  createdAt: timestamp,
  updatedAt: timestamp,
  settings: {
    notifications: boolean,
    soundEnabled: boolean,
    theme: 'light' | 'dark'
  }
}

2. COUPLES COLLECTION (/couples/{coupleId})
-------------------------------------------
{
  id: string,
  user1Id: string,                // First user's ID
  user2Id: string,                // Second user's ID
  user1Name: string,
  user2Name: string,
  coupleName: string,             // Custom couple name
  connectedAt: timestamp,         // When they connected
  anniversary: timestamp | null,  // Optional anniversary date
  pet: {
    name: string,
    skin: string,
    happiness: number (0-100),
    hunger: number (0-100),
    lastFed: timestamp | null,
    lastPlayed: timestamp | null,
    lastBathed: timestamp | null,
    lastSlept: timestamp | null
  },
  loveZone: {
    level: number,
    unlockedItems: array,
    placedItems: array
  },
  createdAt: timestamp,
  updatedAt: timestamp
}

3. NOTES COLLECTION (/notes/{noteId})
-------------------------------------------
{
  coupleId: string,               // Reference to couple
  senderId: string,               // Sender's user ID
  receiverId: string,             // Receiver's user ID
  type: 'text' | 'doodle',        // Note type
  content: string,                // Text content or JSON string for doodle
  doodlePaths: array | null,      // For doodle notes: [{path, color}]
  isRead: boolean,
  isLiked: boolean,
  createdAt: timestamp
}

4. GIFTS COLLECTION (/gifts/{giftId})
-------------------------------------------
{
  coupleId: string,
  senderId: string,
  receiverId: string,
  giftId: string,                 // Gift type ID (heart, kiss, rose, etc.)
  emoji: string,
  label: string,
  hearts: number,                 // Cost in hearts
  message: string | null,         // Optional message
  isOpened: boolean,
  createdAt: timestamp
}

5. MOODS COLLECTION (/moods/{moodId})
-------------------------------------------
{
  coupleId: string,
  userId: string,
  moodId: string,                 // Mood type ID
  emoji: string,
  label: string,
  note: string | null,            // Optional note about mood
  createdAt: timestamp
}

===========================================
FIRESTORE SECURITY RULES
===========================================

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function isInCouple(coupleId) {
      let couple = get(/databases/$(database)/documents/couples/$(coupleId)).data;
      return request.auth.uid == couple.user1Id || request.auth.uid == couple.user2Id;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isOwner(userId);
      allow update, delete: if isOwner(userId);
    }
    
    // Couples collection
    match /couples/{coupleId} {
      allow read: if isAuthenticated() && isInCouple(coupleId);
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && isInCouple(coupleId);
      allow delete: if isAuthenticated() && isInCouple(coupleId);
    }
    
    // Notes collection
    match /notes/{noteId} {
      allow read: if isAuthenticated() && isInCouple(resource.data.coupleId);
      allow create: if isAuthenticated() && isInCouple(request.resource.data.coupleId);
      allow update, delete: if isAuthenticated() && isInCouple(resource.data.coupleId);
    }
    
    // Gifts collection
    match /gifts/{giftId} {
      allow read: if isAuthenticated() && isInCouple(resource.data.coupleId);
      allow create: if isAuthenticated() && isInCouple(request.resource.data.coupleId);
      allow update, delete: if isAuthenticated() && isInCouple(resource.data.coupleId);
    }
    
    // Moods collection
    match /moods/{moodId} {
      allow read: if isAuthenticated() && isInCouple(resource.data.coupleId);
      allow create: if isAuthenticated() && isInCouple(request.resource.data.coupleId);
      allow update, delete: if isAuthenticated() && 
        isInCouple(resource.data.coupleId) && 
        resource.data.userId == request.auth.uid;
    }
  }
}

===========================================
STORAGE RULES
===========================================

rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /profilePhotos/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /doodles/{coupleId}/{fileName} {
      // Allow if user is part of the couple
      allow read, write: if request.auth != null;
    }
  }
}

===========================================
INDEXES REQUIRED
===========================================

Collection: notes
- coupleId (ASC), createdAt (DESC)
- coupleId (ASC), senderId (ASC), createdAt (DESC)
- coupleId (ASC), receiverId (ASC), createdAt (DESC)
- coupleId (ASC), receiverId (ASC), isRead (ASC), createdAt (DESC)

Collection: gifts
- coupleId (ASC), createdAt (DESC)
- coupleId (ASC), senderId (ASC), createdAt (DESC)
- coupleId (ASC), receiverId (ASC), createdAt (DESC)

Collection: moods
- coupleId (ASC), createdAt (DESC)
- coupleId (ASC), userId (ASC), createdAt (DESC)

*/
