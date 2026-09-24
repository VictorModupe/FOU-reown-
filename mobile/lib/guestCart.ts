import * as SecureStore from "expo-secure-store";

const GUEST_CART_SESSION_KEY = "guest_cart_session_id";

const createSessionId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random()
    .toString(36)
    .slice(2)}`;

export const getGuestCartSessionId = async () => {
  const existingSessionId = await SecureStore.getItemAsync(GUEST_CART_SESSION_KEY);
  if (existingSessionId) return existingSessionId;

  const sessionId = createSessionId();
  await SecureStore.setItemAsync(GUEST_CART_SESSION_KEY, sessionId);
  return sessionId;
};
