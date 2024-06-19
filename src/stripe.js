import { loadStripe } from "@stripe/stripe-js";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import "firebase/compat/functions";
import { initFirebase } from "./utils";

initFirebase();

const getBillingPageUrl = () => {
  const billingPageUrl = new URL("/account/billing", window.location.origin);

  return billingPageUrl.toString();
};

export const getStripe = async () => {
  return loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
};

export const getSubscriptionPlans = async () => {
  const plans = [];

  const productsSnap = await firebase
    .firestore()
    .collection("products")
    .where("active", "==", true)
    .get();

  productsSnap.forEach((doc) => {
    plans.push({
      id: doc.id,
      ...doc.data(),
    });
  });

  return plans;
};

export const getSubscriptionPlan = async (role) => {
  let plan;

  const productsSnap = await firebase
    .firestore()
    .collection("products")
    .where("active", "==", true)
    .where("role", "==", role)
    .limit(1)
    .get();

  productsSnap.forEach((doc) => {
    plan = {
      id: doc.id,
      ...doc.data(),
    };
  });

  if (!plan) {
    throw new Error(`Cannot find subscription plan for role "${role}"`);
  }

  return plan;
};

export const getPrices = async (product, productName) => {
  const snap = await firebase
    .firestore()
    .collection("products")
    .doc(product)
    .collection("prices")
    .where("active", "==", true)
    .get();

  let id;
  let cost;
  let interval;
  let planName;
  const prices = [];

  snap.forEach((doc) => {
    if (doc.data().active) {
      id = doc.id;
      cost = doc.data().unit_amount;
      interval = doc.data().interval;
      planName = productName;
      prices.push({ id, cost, interval, planName });
    }
  });

  return prices;
};

/**
 * Start a subscription
 *
 * @param {object} user
 * @param {object} session
 *  See https://console.firebase.google.com/project/whatboard-dev/extensions/instances/firestore-stripe-subscriptions
 *  Specifically the "Start a subscription with Stripe Checkout" of the "How this extension works" tab
 */
export const startSubscription = async (user, session = {}) => {
  const docRef = await firebase
    .firestore()
    .collection("customers")
    .doc(user.uid)
    .collection("checkout_sessions")
    .add({
      // eslint-disable-next-line camelcase
      success_url: getBillingPageUrl(),
      // eslint-disable-next-line camelcase
      allow_promotion_codes: true,
      // eslint-disable-next-line camelcase
      cancel_url: getBillingPageUrl(),
      ...session,
    });

  return new Promise((resolve, reject) => {
    // Wait for the CheckoutSession to get attached by the extension
    docRef.onSnapshot(async (snap) => {
      const { error, sessionId } = snap.data();

      if (error) {
        // Show an error to your customer and
        // inspect your Cloud Function logs in the Firebase console.
        reject(error);
      }

      if (sessionId) {
        // We have a session, let's redirect to Checkout
        // Init Stripe
        const stripe = await getStripe();
        resolve(stripe.redirectToCheckout({ sessionId }));
      }
    });
  });
};

export const getUserSubscription = async (user) => {
  const snapshot = await firebase
    .firestore()
    .collection("customers")
    .doc(user.uid)
    .collection("subscriptions")
    .where("status", "in", ["trialing", "active"])
    .get();

  const doc = snapshot.docs[snapshot.docs.length - 1];

  return doc;
};

export const getCustomerRecord = async (user) => {
  const snapshot = await firebase
    .firestore()
    .collection("customers")
    .doc(user.uid)
    .get();

  return snapshot.data();
};

/**
 * Retrieve the URL for the current user's Stripe Customer Portal
 *
 * @param {object} params
 *  See https://console.firebase.google.com/project/whatboard-dev/extensions/instances/firestore-stripe-subscriptions
 *  Specifically the "Redirect to the customer portal" of the "How this extension works" tab
 */
export const getCustomerPortalUrl = async (params = {}) => {
  const functionRef = firebase
    .app()
    .functions("us-central1")
    .httpsCallable("ext-firestore-stripe-subscriptions-createPortalLink");

  const { data } = await functionRef({
    returnUrl: getBillingPageUrl(),
    ...params,
  });

  return data.url;
};
