/**
 * Firebase Cloud Functions for Lovelee App
 * Handles push notifications for various app events
 */

const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();

/**
 * Send push notification via Expo's push service
 * @param {string} expoPushToken - The Expo push token
 * @param {object} notification - Notification content
 */
async function sendExpoPushNotification(expoPushToken, notification) {
  if (!expoPushToken || !expoPushToken.startsWith("ExponentPushToken")) {
    console.log("Invalid Expo push token:", expoPushToken);
    return;
  }

  const message = {
    to: expoPushToken,
    sound: "default",
    title: notification.title,
    body: notification.body,
    data: notification.data || {},
  };

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    console.log("Push notification sent:", result);
    return result;
  } catch (error) {
    console.error("Error sending push notification:", error);
    throw error;
  }
}

/**
 * Create an in-app notification in Firestore
 * @param {string} userId - The recipient user ID
 * @param {object} notification - Notification data
 */
async function createInAppNotification(userId, notification) {
  try {
    await db.collection("notifications").add({
      userId,
      type: notification.type,
      title: notification.title,
      message: notification.body,
      fullMessage: notification.fullMessage || notification.body,
      relatedId: notification.relatedId || null,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log("In-app notification created for user:", userId);
  } catch (error) {
    console.error("Error creating in-app notification:", error);
  }
}

/**
 * Get user profile by ID
 * @param {string} userId - User ID
 */
async function getUserProfile(userId) {
  const userDoc = await db.collection("users").doc(userId).get();
  return userDoc.exists ? {id: userDoc.id, ...userDoc.data()} : null;
}

// ============================================
// NOTES/MESSAGES NOTIFICATIONS
// ============================================

/**
 * Trigger when a new note is created
 * Sends notification to the receiver
 */
exports.onNewNote = onDocumentCreated("notes/{noteId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    console.log("No data associated with the event");
    return null;
  }

  const note = snapshot.data();
  const noteId = event.params.noteId;

  // Get receiver's profile
  const receiverId = note.receiverId;
  if (!receiverId) {
    console.log("No receiver ID in note");
    return null;
  }

  const receiver = await getUserProfile(receiverId);
  if (!receiver) {
    console.log("Receiver not found:", receiverId);
    return null;
  }

  // Get sender's name
  const sender = await getUserProfile(note.senderId);
  const senderName = sender?.displayName || "Your partner";

  // Build notification content
  const isVoiceNote = note.type === "voice";
  const isDoodle = note.type === "doodle";
  let messagePreview = "";

  if (isVoiceNote) {
    messagePreview = "sent you a voice note 🎙️";
  } else if (isDoodle) {
    messagePreview = "sent you a doodle 🎨";
  } else {
    const content = note.content || "";
    messagePreview = content.length > 50 ?
      content.substring(0, 50) + "..." :
      content;
  }

  const notification = {
    type: "msg",
    title: `💌 New message from ${senderName}`,
    body: isVoiceNote || isDoodle ? messagePreview : `"${messagePreview}"`,
    fullMessage: note.content || messagePreview,
    relatedId: noteId,
    data: {
      type: "note",
      noteId: noteId,
      senderId: note.senderId,
    },
  };

  // Create in-app notification
  await createInAppNotification(receiverId, notification);

  // Send push notification if user has a token
  if (receiver.expoPushToken) {
    await sendExpoPushNotification(receiver.expoPushToken, notification);
  }

  return null;
});

// ============================================
// MOOD NOTIFICATIONS
// ============================================

/**
 * Trigger when a mood is updated/created
 * Notifies partner about mood change
 */
exports.onMoodChange = onDocumentCreated("moods/{moodId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return null;

  const mood = snapshot.data();
  const userId = mood.userId;

  // Get user's partner
  const user = await getUserProfile(userId);
  if (!user || !user.partnerId) {
    console.log("User has no partner");
    return null;
  }

  const partner = await getUserProfile(user.partnerId);
  if (!partner) return null;

  const userName = user.displayName || "Your partner";
  const moodEmoji = getMoodEmoji(mood.mood);

  const notification = {
    type: "mood",
    title: `${moodEmoji} ${userName}'s mood changed`,
    body: `${userName} is feeling ${mood.mood}`,
    fullMessage: mood.note ?
      `${userName} is feeling ${mood.mood}: "${mood.note}"` :
      `${userName} is feeling ${mood.mood}`,
    relatedId: mood.userId,
    data: {
      type: "mood",
      userId: userId,
      mood: mood.mood,
    },
  };

  await createInAppNotification(partner.id, notification);

  if (partner.expoPushToken) {
    await sendExpoPushNotification(partner.expoPushToken, notification);
  }

  return null;
});

/**
 * Get emoji for mood
 */
function getMoodEmoji(mood) {
  const moodEmojis = {
    happy: "😊",
    excited: "🤩",
    loved: "🥰",
    calm: "😌",
    tired: "😴",
    stressed: "😰",
    sad: "😢",
    angry: "😠",
    anxious: "😟",
    grateful: "🙏",
  };
  return moodEmojis[mood?.toLowerCase()] || "💭";
}

// ============================================
// GIFT NOTIFICATIONS
// ============================================

/**
 * Trigger when a gift is sent
 */
exports.onGiftSent = onDocumentCreated("gifts/{giftId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return null;

  const gift = snapshot.data();
  const giftId = event.params.giftId;

  const receiverId = gift.receiverId;
  if (!receiverId) return null;

  const receiver = await getUserProfile(receiverId);
  if (!receiver) return null;

  const sender = await getUserProfile(gift.senderId);
  const senderName = sender?.displayName || "Your partner";

  const notification = {
    type: "gift",
    title: `🎁 ${senderName} sent you a gift!`,
    body: `You received: ${gift.name || "a special gift"}`,
    fullMessage: gift.message ?
      `${senderName} sent you ${gift.name}: "${gift.message}"` :
      `${senderName} sent you ${gift.name || "a special gift"}!`,
    relatedId: giftId,
    data: {
      type: "gift",
      giftId: giftId,
      senderId: gift.senderId,
    },
  };

  await createInAppNotification(receiverId, notification);

  if (receiver.expoPushToken) {
    await sendExpoPushNotification(receiver.expoPushToken, notification);
  }

  return null;
});

// ============================================
// DATE NOTIFICATIONS
// ============================================

/**
 * Trigger when a new date is created
 */
exports.onDateCreated = onDocumentCreated("dates/{dateId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return null;

  const dateData = snapshot.data();
  const dateId = event.params.dateId;
  const creatorId = dateData.createdBy;

  // Get creator's partner
  const creator = await getUserProfile(creatorId);
  if (!creator || !creator.partnerId) return null;

  const partner = await getUserProfile(creator.partnerId);
  if (!partner) return null;

  const creatorName = creator.displayName || "Your partner";

  const notification = {
    type: "date",
    title: "📅 New date planned!",
    body: `${creatorName} planned: ${dateData.title || "a special date"}`,
    fullMessage: dateData.description ?
      `${creatorName} planned "${dateData.title}": ${dateData.description}` :
      `${creatorName} planned "${dateData.title || "a special date"}"`,
    relatedId: dateId,
    data: {
      type: "date",
      dateId: dateId,
      creatorId: creatorId,
    },
  };

  await createInAppNotification(partner.id, notification);

  if (partner.expoPushToken) {
    await sendExpoPushNotification(partner.expoPushToken, notification);
  }

  return null;
});

