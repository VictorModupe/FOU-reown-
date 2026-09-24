import { clerkClient, requireAuth } from "@clerk/express";
import { User } from "../models/user.model.js";
import { ENV } from "../config/env.js";

export const protectRoute = [
  requireAuth(),
  async (req, res, next) => {
    try {
      const clerkId = req.auth().userId;
      if (!clerkId) return res.status(401).json({ message: "Unauthorized - invalid token" });

      let user = await User.findOne({ clerkId });
      if (!user) {
        const clerkUser = await clerkClient.users.getUser(clerkId);
        const email = clerkUser.emailAddresses[0]?.emailAddress;
        if (!email) return res.status(400).json({ message: "Your account has no email address" });

        user = await User.findOneAndUpdate(
          { clerkId },
          {
            clerkId,
            email,
            name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || "User",
            imageUrl: clerkUser.imageUrl,
            role: "customer",
            addresses: [],
            wishlist: [],
          },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );
      }

      req.user = user;

      next();
    } catch (error) {
      console.error("Error in protectRoute middleware", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
];

export const optionalAuth = async (req, res, next) => {
  try {
    const clerkId = req.auth?.().userId;
    if (!clerkId) return next();

    let user = await User.findOne({ clerkId });
    if (!user) {
      const clerkUser = await clerkClient.users.getUser(clerkId);
      const email = clerkUser.emailAddresses[0]?.emailAddress;
      if (!email) return res.status(400).json({ message: "Your account has no email address" });

      user = await User.findOneAndUpdate(
        { clerkId },
        {
          clerkId,
          email,
          name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || "User",
          imageUrl: clerkUser.imageUrl,
          role: "customer",
          addresses: [],
          wishlist: [],
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Error in optionalAuth middleware", error);
    res.status(500).json({ message: "Internal server error" });
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

  if (req.user.email !== ENV.ADMIN_EMAIL && !["vendor", "admin"].includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden - vendor access only" });
  }

  next();
};
