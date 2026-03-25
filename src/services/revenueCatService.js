import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';

const RC_API_KEY_IOS = 'appl_YdIXXLDIUALQvnrweIybSHnmzve'; // TODO: replace with actual key
const ENTITLEMENT_ID = 'Pairly Pro';

export const initRevenueCat = async () => {
  Purchases.configure({ apiKey: RC_API_KEY_IOS });
};

export const identifyUser = async (firebaseUID) => {
  try {
    const { customerInfo } = await Purchases.logIn(firebaseUID);
    return customerInfo;
  } catch (error) {
    console.error('RC identify error:', error);
    return null;
  }
};

export const logoutUser = async () => {
  try {
    if (await Purchases.isAnonymous()) return;
    await Purchases.logOut();
  } catch (error) {
    console.error('RC logout error:', error);
  }
};

export const getOfferings = async () => {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (error) {
    console.error('RC offerings error:', error);
    return null;
  }
};

export const purchasePackage = async (pkg) => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { success: true, customerInfo, error: null };
  } catch (error) {
    if (error.userCancelled) {
      return { success: false, customerInfo: null, error: 'cancelled' };
    }
    console.error('RC purchase error:', error);
    return { success: false, customerInfo: null, error: error.message };
  }
};

export const restorePurchases = async () => {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return { success: true, customerInfo, error: null };
  } catch (error) {
    console.error('RC restore error:', error);
    return { success: false, customerInfo: null, error: error.message };
  }
};

export const getCustomerInfo = async () => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    console.error('RC customer info error:', error);
    return null;
  }
};

export const parseCustomerInfo = (customerInfo) => {
  if (!customerInfo) {
    return {
      isPremium: false,
      isPromotional: false,
      hasPurchaseHistory: false,
      subscriptionPlan: null,
      expirationDate: null,
    };
  }

  const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
  const isPremium = !!entitlement;
  const isPromotional = entitlement?.store === 'PROMOTIONAL';
  const allPurchaseDates = customerInfo.allPurchaseDates || {};
  const hasPurchaseHistory = Object.keys(allPurchaseDates).length > 0;

  let subscriptionPlan = null;

  if (entitlement) {
    const productId = entitlement.productIdentifier || '';
    if (productId.includes('yearly') || productId.includes('annual')) {
      subscriptionPlan = 'yearly';
    } else if (productId.includes('monthly')) {
      subscriptionPlan = 'monthly';
    }
  }

  let expirationDate = null;
  if (entitlement?.expirationDate) {
    expirationDate = new Date(entitlement.expirationDate);
  }

  return {
    isPremium,
    isPromotional,
    hasPurchaseHistory,
    subscriptionPlan,
    expirationDate,
  };
};

export const addCustomerInfoListener = (callback) => {
  Purchases.addCustomerInfoUpdateListener(callback);
};

export const ENTITLEMENT = ENTITLEMENT_ID;
