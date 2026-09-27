const GUEST_SESSION_ID_PATTERN = /^[a-zA-Z0-9-]{16,128}$/;

export const isValidGuestSessionId = (guestSessionId) =>
  typeof guestSessionId === "string" && GUEST_SESSION_ID_PATTERN.test(guestSessionId);

export const getGuestSessionId = (req) => {
  const guestSessionId = req.get("x-guest-session-id");
  return isValidGuestSessionId(guestSessionId) ? guestSessionId : null;
};