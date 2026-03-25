# Lovelee App — Subscription & Paywall Implementation Plan

## Overview

Integrate RevenueCat as the single source of truth for premium status. When one user in a couple purchases a subscription, the partner automatically receives premium via RevenueCat promotional entitlements — granted through a Firebase Cloud Function triggered by RC webhooks.

---

## Subscription Plans

| Plan | Price | Trial | Notes |
|------|-------|-------|-------|
| Yearly | US$39.99/year | 3-day free trial | Only plan with a free trial |
| Monthly | US$7.99/month | None | No trial, cancellable anytime |

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│                   RevenueCat                      │
│  (Single source of truth for premium status)      │
│                                                   │
│  appUserID = Firebase UID                         │
│  Entitlement: "premium"                           │
└────────────┬─────────────────────┬────────────────┘
             │                     │
       SDK (client)          Webhooks (server)
             │                     │
     ┌───────▼───────┐    ┌───────▼────────────┐
     │  React Native  │    │  Firebase Cloud     │
     │  App (Expo)    │    │  Function           │
     │                │    │                     │
     │ - Show paywall │    │ - Grant promo to    │
     │ - Check status │    │   partner           │
     │ - Restore      │    │ - Revoke on cancel  │
     └───────┬────────┘    └───────┬─────────────┘
             │                     │
             └──────────┬──────────┘
                        │
               ┌────────▼────────┐
               │    Firestore    │
               │                 │
               │ /users/{uid}    │
               │  - partnerId    │
               │  - coupleId     │
               └─────────────────┘
```

---

## Implementation Tasks

### Phase 1: RevenueCat Setup

#### 1.1 RevenueCat Dashboard Configuration
- Create a new project in RevenueCat dashboard
- Create entitlement: `premium`
- Create offerings:
  - `yearly` — US$39.99/year with 3-day free trial (introductory offer)
  - `monthly` — US$7.99/month (auto-renewable subscription)
- Configure App Store Connect products (both auto-renewable subscriptions)
- Set up webhook URL pointing to the Cloud Function endpoint
- Note the RC Public SDK Key and Secret API Key

#### 1.2 Install RevenueCat SDK
- Install `react-native-purchases` package
- Initialize RC SDK on app launch (in `app/_layout.js`)
- Identify user with Firebase UID after auth: `Purchases.logIn(firebaseUID)`
- On logout: `Purchases.logOut()`

---

### Phase 2: Paywall Screen Refactor (`app/premium.js`)

#### 2.1 Reusable Paywall/Expired Screen
Use the existing `app/premium.js` as a **single component** that handles two modes via route params:

| Mode | When shown | Title | CTA |
|------|-----------|-------|-----|
| `paywall` | User taps "Upgrade to Pro" or feature is gated | "Unlock Pro levels of love" | "Subscribe" / "Try for free" |
| `expired` | Subscription has expired | "Your Pro subscription has ended" | "Subscribe" |

Route params: `router.push({ pathname: '/premium', params: { mode: 'paywall' | 'expired' } })`

#### 2.2 Paywall Mode
- Fetch current offerings from RevenueCat: `Purchases.getOfferings()`
- Display two plan cards:
  - **Yearly** — US$39.99/year, "3-day free trial" badge (show trial only if eligible via RC)
  - **Monthly** — US$7.99/month, no badge
- Features list (keep existing):
  - Free Pro for partner (2 for 1)
  - Unlimited love letters
  - Full access to all Pro features
- CTA button triggers `Purchases.purchasePackage(selectedPackage)`
- On success: RC SDK handles everything, close paywall
- On failure/cancel: show error or silently dismiss
- Restore button: `Purchases.restorePurchases()`

#### 2.3 Expired Mode
- Same layout as paywall but with different header text:
  - Title: "Your Pro subscription has ended"
  - Subtitle: "Resubscribe to continue enjoying Pro features with your partner"
- Same plan cards and purchase flow
- No trial option shown (RC handles trial eligibility automatically)

#### 2.4 Remove Firebase Premium Logic
- Remove `updatePremiumStatus()` calls from `handlePurchase`
- Remove manual `isPremium` / `premiumExpiry` writes to Firestore
- Premium status is now read from RevenueCat only

---

### Phase 3: Premium Status Check (Client-side)

#### 3.1 Listener Setup
- Set up `Purchases.addCustomerInfoUpdateListener()` in `app/_layout.js`
- On every update, check `customerInfo.entitlements.active["premium"]`
- Update Zustand store: `setPremium(isActive)`

#### 3.2 Update Zustand Store (`src/store/store.js`)
- Keep `isPremium` in store but source it from RC listener (not Firebase)
- Remove `hasUsedTrial` / `trialExpiry` — RC handles trial eligibility internally
- Add `subscriptionPlan` to store: `'yearly' | 'monthly' | null`
- Add `expirationDate` to store for UI display

#### 3.3 Premium Gating
- Wherever features are gated, check `isPremium` from Zustand store
- If not premium → navigate to paywall: `router.push({ pathname: '/premium', params: { mode: 'paywall' } })`

---

### Phase 4: Profile Subscription Card (`app/(tabs)/profile.js`)

#### 4.1 Replace Current "Upgrade to Pro" Card
The existing subscription card at line 528-548 of `profile.js` currently shows:
- **Not premium**: "Upgrade to Pro" → navigates to `/premium`
- **Premium**: "Pairly Pro" → also navigates to `/premium`

Replace with **four states** using the same `premiumCard` component:

| State | Condition | Icon | Title | Subtitle | onPress |
|-------|-----------|------|-------|----------|---------|
| Not subscribed | No entitlement, no purchase history | `diamond` | "Upgrade to Pro" | "Unlock unlimited features" | Navigate to paywall |
| Active (paid) | Entitlement active + user purchased | `checkmark-circle` | "Lovelee Pro" | "Yearly · Renews Mar 2027" or "Monthly · Renews Mar 2026" | Open App Store subscription management |
| Active (promo) | Entitlement active + no purchase (partner gifted) | `checkmark-circle` | "Lovelee Pro" | "Gifted by your partner" | No action (no subscription to manage) |
| Expired | No entitlement + has purchase history | `alert-circle` | "Subscription Expired" | "Your Pro access has ended" | Navigate to expired paywall |

**Key distinction**: User B (who received promo from partner) sees "Upgrade to Pro" when promo is revoked — NOT "Expired" — because they never purchased themselves.

#### 4.2 Manage Subscription (Active Paid Users)
- On tap: open App Store subscription management page
- Use `Linking.openURL('https://apps.apple.com/account/subscriptions')` (iOS)

#### 4.3 Expired Subscription (Users Who Previously Purchased)
- On tap: navigate to `router.push({ pathname: '/premium', params: { mode: 'expired' } })`

---

### Phase 5: Partner Premium Sync (Cloud Function)

#### 5.1 RevenueCat Webhook Handler
Add a new Cloud Function in `functions/index.js`:

**Endpoint**: `revenuecatWebhook` (HTTP function, not Firestore trigger)

**Events to handle**:

| RC Event | Action |
|----------|--------|
| `INITIAL_PURCHASE` | Look up `partnerId` in Firestore → call RC REST API to grant promotional entitlement to partner |
| `RENEWAL` | Re-grant promotional entitlement to partner with matching duration |
| `CANCELLATION` | Revoke promotional entitlement from partner |
| `EXPIRATION` | Revoke promotional entitlement from partner |
| `BILLING_ISSUE_DETECTED` | Optional: notify partner |

**Logic**:
```
1. Verify webhook auth header matches RC webhook secret
2. Extract app_user_id from event payload (= Firebase UID)
3. Look up user in Firestore → get partnerId
4. If no partnerId → log only (partner promo sync runs on couple connect via `onCoupleCreated`)
5. If partnerId exists:
   - For grant events → POST to RC REST API:
     /v1/subscribers/{partnerId}/entitlements/premium/promotional
   - For revoke events → POST revoke to RC REST API:
     /v1/subscribers/{partnerId}/entitlements/premium/revoke_promotionals
```

#### 5.2 RC REST API Calls
- **Grant**: `POST /v1/subscribers/{app_user_id}/entitlements/{entitlement_id}/promotional`
  - Header: `Authorization: Bearer {RC_SECRET_API_KEY}`
  - Body: `{ "duration": "yearly" }` or `{ "duration": "monthly" }`
- **Revoke**: `POST /v1/subscribers/{app_user_id}/entitlements/{entitlement_id}/revoke_promotionals`
  - Header: `Authorization: Bearer {RC_SECRET_API_KEY}`

#### 5.3 Store RC Secret Key
- Use Firebase environment config: `firebase functions:config:set revenuecat.secret="sk_..."`
- Never expose in client-side code

---

### Phase 6: Edge Case — Partner Connects After Purchase

#### 6.1 On Connect (in `coupleService.js` `connectWithPartner`)
After creating the couple and linking both users:
1. Check if either user has an active RC entitlement
2. If yes → call RC REST API to grant promo to the other user
3. This can be done via a Cloud Function triggered by Firestore update on the user doc (when `partnerId` changes from null to a value)

#### 6.2 Alternative: Firestore Trigger
Add an `onUpdate` trigger on `/users/{userId}`:
- If `partnerId` changed from `null` → a value (newly connected)
- Check if this user or the new partner has active RC entitlement
- If yes → grant promo to the other

---

## File Changes Summary

| File | Changes |
|------|---------|
| `package.json` | Add `react-native-purchases` dependency |
| `app/_layout.js` | Initialize RevenueCat SDK, set up customer info listener |
| `app/premium.js` | Refactor to use RC SDK for purchases, support `paywall` / `expired` modes via route params |
| `app/(tabs)/profile.js` | Update subscription card to show 3 states (upgrade / active+manage / expired) |
| `src/store/store.js` | Source `isPremium` from RC, add `subscriptionPlan` and `expirationDate`, remove `hasUsedTrial` / `trialExpiry` |
| `src/firebase/services/userService.js` | Remove `updatePremiumStatus` (no longer needed for premium — RC is source of truth). Keep for other user fields. |
| `functions/index.js` | Add `revenuecatWebhook` HTTP function for partner promo grant/revoke |
| `functions/package.json` | Add `node-fetch` or use built-in `fetch` for RC API calls |

---

## What We Are NOT Doing (MVP Scope)

- No Android support for now (iOS-only subscription management link)
- No in-app receipt validation (RevenueCat handles this)
- No custom subscription analytics dashboard (use RC dashboard)
- No grace period handling (keep it simple — expired = expired)
- No proration or plan upgrade/downgrade logic (App Store handles this natively)
- No family sharing support
- No refund handling (handled by App Store + RC automatically)

---

## Testing Checklist

- [ ] User A purchases yearly → User A gets premium
- [ ] User B (partner) automatically gets premium via promo
- [ ] User A cancels → both lose premium at period end
- [ ] User A purchases monthly → both get monthly premium
- [ ] Expired user sees expired paywall with correct text
- [ ] Active user taps manage → opens App Store subscriptions
- [ ] Restore purchases works for both users
- [ ] User purchases before connecting → partner gets premium on connect
- [ ] Disconnecting couple → partner keeps promo until original sub expires/cancels
- [ ] Monthly subscriber sees correct renewal date in profile card
- [ ] Trial eligibility handled by RC (no manual tracking)
