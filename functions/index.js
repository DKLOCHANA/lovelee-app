/**
 * Firebase Cloud Functions for Pairly App
 * Handles push notifications for various app events
 */

const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const {onRequest} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");
const admin = require("firebase-admin");

const rcSecretApiKey = defineSecret("REVENUECAT_SECRET_API_KEY");
const rcWebhookSecret = defineSecret("REVENUECAT_WEBHOOK_SECRET");

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

// ============================================
// REVENUECAT — PARTNER PREMIUM SYNC
// ============================================

const RC_API_BASE = "https://api.revenuecat.com/v1";
const RC_ENTITLEMENT_ID = "Pairly Pro";

/**
 * Grant a promotional entitlement to a user via RevenueCat REST API
 */
async function grantPromoEntitlement(appUserId, duration, secretKey) {
  const encodedEntitlement = encodeURIComponent(RC_ENTITLEMENT_ID);
  const url =
    `${RC_API_BASE}/subscribers/${appUserId}` +
    `/entitlements/${encodedEntitlement}/promotional`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({duration}),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("RC grant promo failed:", response.status, body);
    return false;
  }
  console.log("RC promo granted to:", appUserId);
  return true;
}

/**
 * Revoke promotional entitlements from a user via RevenueCat REST API
 */
async function revokePromoEntitlement(appUserId, secretKey) {
  const encodedEntitlement = encodeURIComponent(RC_ENTITLEMENT_ID);
  const url =
    `${RC_API_BASE}/subscribers/${appUserId}` +
    `/entitlements/${encodedEntitlement}/revoke_promotionals`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("RC revoke promo failed:", response.status, body);
    return false;
  }
  console.log("RC promo revoked from:", appUserId);
  return true;
}

/**
 * Check if a user has an active subscription in RevenueCat
 */
async function checkRCSubscription(appUserId, secretKey) {
  const url = `${RC_API_BASE}/subscribers/${appUserId}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) return null;

  const data = await response.json();
  const entitlements = data?.subscriber?.entitlements;
  if (!entitlements || !entitlements[RC_ENTITLEMENT_ID]) return null;

  const ent = entitlements[RC_ENTITLEMENT_ID];
  const expiresDate = ent.expires_date ? new Date(ent.expires_date) : null;
  const isActive = !expiresDate || expiresDate > new Date();

  return isActive ? ent : null;
}

/**
 * Map RC product period to promo duration
 */
function mapProductToDuration(productId) {
  if (!productId) return "monthly";
  if (productId.includes("yearly") || productId.includes("annual")) {
    return "yearly";
  }
  return "monthly";
}

/**
 * RevenueCat Webhook Handler
 * Receives purchase/cancellation/expiration events and syncs partner premium
 */
exports.revenuecatWebhook = onRequest(
    {secrets: [rcSecretApiKey, rcWebhookSecret]},
    async (req, res) => {
      if (req.method !== "POST") {
        return res.status(405).send("Method not allowed");
      }

      const authHeader = req.headers["authorization"];
      const expectedSecret = rcWebhookSecret.value();
      if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
        console.error("Webhook auth failed");
        return res.status(401).send("Unauthorized");
      }

      const event = req.body?.event;
      if (!event) {
        return res.status(400).send("No event in payload");
      }

      const eventType = event.type;
      const appUserId = event.app_user_id;
      const productId = event.product_id;

      console.log(`RC webhook: ${eventType} for user ${appUserId}`);

      if (!appUserId) {
        return res.status(400).send("No app_user_id");
      }

      const user = await getUserProfile(appUserId);
      if (!user) {
        console.log("User not found in Firestore:", appUserId);
        return res.status(200).send("OK — user not found");
      }

      const partnerId = user.partnerId;
      const secret = rcSecretApiKey.value();

      const grantEvents = [
        "INITIAL_PURCHASE",
        "RENEWAL",
        "PRODUCT_CHANGE",
        "UNCANCELLATION",
      ];
      const revokeEvents = [
        "CANCELLATION",
        "EXPIRATION",
        "BILLING_ISSUE",
      ];

      if (grantEvents.includes(eventType)) {
        if (!partnerId) {
          console.log(
              "No partner — promo sync runs when couple connects (onCoupleCreated)",
          );
        } else {
          const duration = mapProductToDuration(productId);
          await grantPromoEntitlement(partnerId, duration, secret);
        }
      } else if (revokeEvents.includes(eventType)) {
        if (partnerId) {
          await revokePromoEntitlement(partnerId, secret);
        }
      }

      return res.status(200).send("OK");
    },
);

// ============================================
// PARTNER CONNECT — RC PROMO SYNC (on couple create)
// ============================================

/**
 * Structured log for Cloud Logging — filter: jsonPayload.fn="onCoupleCreated"
 */
function logCoupleConnect(step, payload = {}) {
  console.log(JSON.stringify({
    fn: "onCoupleCreated",
    step,
    ...payload,
    at: new Date().toISOString(),
  }));
}

/**
 * Runs once when a couple document is created (partner connect batch).
 * Partner sharing expects at least one paying user (active RC entitlement on
 * either partner). If neither has a subscription, no promotional grants.
 * One RC lookup per user (parallel). user2 sub → promo for user1; user1 sub →
 * promo for user2 (both apply when both pay).
 */
exports.onCoupleCreated = onDocumentCreated(
    {document: "couples/{coupleId}", secrets: [rcSecretApiKey]},
    async (event) => {
      const coupleId = event.params.coupleId;
      try {
        const couple = event.data.data();
        const user1Id = couple?.user1Id;
        const user2Id = couple?.user2Id;

        logCoupleConnect("1_enter", {coupleId, user1Id, user2Id});

        if (!user1Id || !user2Id) {
          logCoupleConnect("2_skip_missing_user_ids", {coupleId});
          return null;
        }

        const secret = rcSecretApiKey.value();

        const [sub1, sub2] = await Promise.all([
          checkRCSubscription(user1Id, secret),
          checkRCSubscription(user2Id, secret),
        ]);

        logCoupleConnect("3_rc_status", {
          user1Id,
          user1HasSub: !!sub1,
          user2Id,
          user2HasSub: !!sub2,
        });

        const hasAtLeastOnePayingUser = !!(sub1 || sub2);
        if (!hasAtLeastOnePayingUser) {
          logCoupleConnect("4_no_paying_user", {
            coupleId,
            note: "Neither partner has active RC entitlement — no partner promos",
          });
          return null;
        }

        if (sub2) {
          const duration = mapProductToDuration(sub2.product_identifier);
          const granted = await grantPromoEntitlement(
              user1Id, duration, secret);
          logCoupleConnect("5_grant_user1_from_user2", {user1Id, duration, granted});
        }

        if (sub1) {
          const duration = mapProductToDuration(sub1.product_identifier);
          const granted = await grantPromoEntitlement(
              user2Id, duration, secret);
          logCoupleConnect("6_grant_user2_from_user1", {user2Id, duration, granted});
        }

        logCoupleConnect("7_done", {
          coupleId, user1Id, user2Id, hasAtLeastOnePayingUser: true,
        });
        return null;
      } catch (err) {
        console.error(JSON.stringify({
          fn: "onCoupleCreated",
          step: "error",
          coupleId,
          message: err.message,
          stack: err.stack,
          at: new Date().toISOString(),
        }));
        throw err;
      }
    },
);

