import { clerkClient, requireAuth } from "@clerk/express";
import { User } from "../models/user.model.js";
import { ENV } from "../config/env.js";

class AuthError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Finds the user by clerkId, else links an existing record by VERIFIED email,
// else creates a new one. Never upserts on clerkId (email is also unique).
const getOrCreateUserFromClerk = async (clerkId) => {
  const existing = await User.findOne({ clerkId });
  if (existing) return existing;

  const clerkUser = await clerkClient.users.getUser(clerkId);
  const primary =
    clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId) ??
    clerkUser.emailAddresses[0];
  const email = primary?.emailAddress?.trim().toLowerCase();
  if (!email) throw new AuthError(400, "Your account has no email address");

  const verified = primary.verification?.status === "verified";

  // Link an old record to this Clerk ID. Only clerkId changes: role, cart, etc. stay intact.
  if (verified) {
    const linked = await User.findOneAndUpdate({ email }, { $set: { clerkId } }, { new: true });
    if (linked) return linked;
  }

  try {
    return await User.create({
      clerkId,
      email,
      name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || "User",
      imageUrl: clerkUser.imageUrl,
      role: "customer",
      addresses: [],
      wishlist: [],
    });
  } catch (err) {
    if (err.code === 11000) {
      // Parallel request created it first (/users/me, /cart, /wishlist fire together)
      const raced = await User.findOne({ clerkId });
      if (raced) return raced;
      // Email belongs to another record and Clerk hasn't verified it
      throw new AuthError(409, "An account with this email already exists. Verify your email and try again.");
    }
    throw err;
  }
};

const handleAuthError = (label, clerkId, error, res) => {
  console.error(`Error in ${label} middleware (clerkId: ${clerkId})`, error);
  if (error instanceof AuthError) return res.status(error.status).json({ message: error.message });
  return res.status(500).json({ message: "Internal server error" });
};

export const protectRoute = [
  requireAuth(),
  async (req, res, next) => {
    let clerkId;
    try {
      clerkId = req.auth().userId;
      if (!clerkId) return res.status(401).json({ message: "Unauthorized - invalid token" });

      req.user = await getOrCreateUserFromClerk(clerkId);
      next();
    } catch (error) {
      handleAuthError("protectRoute", clerkId, error, res);
    }
  },
];

export const optionalAuth = async (req, res, next) => {
  let clerkId;
  try {
    clerkId = req.auth?.().userId;
    if (!clerkId) return next();

    req.user = await getOrCreateUserFromClerk(clerkId);
    next();
  } catch (error) {
    handleAuthError("optionalAuth", clerkId, error, res);
  }
};

export const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized - user not found" });
  }

  if (req.user.email !== ENV.ADMIN_EMAIL) {
    return res.status(403).json({ message: "Forbidden - admin access only" });
  }

  next();
};

export const vendorOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized - user not found" });
  }

  if (req.user.email !== ENV.ADMIN_EMAIL && !["vendor"].includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden - vendor access only" });
  }

  next();
};
