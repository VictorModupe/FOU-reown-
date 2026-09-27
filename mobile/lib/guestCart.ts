import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";

const GUEST_CART_SESSION_KEY = "guest_cart_session_id";
let guestSessionIdPromise: Promise<string> | null = null;

const createSessionId = () => Crypto.randomUUID();

export const getGuestCartSessionId = () => {
  if (!guestSessionIdPromise) {
    guestSessionIdPromise = SecureStore.getItemAsync(GUEST_CART_SESSION_KEY)
      .then(async (existingSessionId) => {
        if (existingSessionId) return existingSessionId;

        const sessionId = createSessionId();
        await SecureStore.setItemAsync(GUEST_CART_SESSION_KEY, sessionId);
        return sessionId;
      })
      .catch((error) => {
        guestSessionIdPromise = null;
        throw error;
      });
  }

  return guestSessionIdPromise;
};
