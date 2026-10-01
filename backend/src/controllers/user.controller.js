import { User } from "../models/user.model.js";
import { ENV } from "../config/env.js";
import { ensureFouOrganizationMembership, getFouOrganizationAppRole } from "../lib/vendor-membership.js";

export async function getCurrentUser(req, res) {
  try {
    const organizationRole = ENV.CLERK_VENDOR_ORGANIZATION_ID
      ? await getFouOrganizationAppRole(req.user.clerkId)
      : null;
    const isVendor = organizationRole === "vendor";
    const role = req.user.email === ENV.ADMIN_EMAIL ? "admin" : isVendor ? "vendor" : "customer";
    if (req.user.role !== role) {
      req.user.role = role;
      await req.user.save();
    }
    const user = req.user.toObject();
    res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching current user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function completeSignup(req, res) {
  const requestedRole = req.body?.role;
  if (!["customer", "vendor"].includes(requestedRole)) {
    return res.status(400).json({ error: "Choose a valid account type" });
  }

  try {
    await ensureFouOrganizationMembership(req.user.clerkId, requestedRole);
    const role = await getFouOrganizationAppRole(req.user.clerkId);
    if (role !== requestedRole) {
      throw new Error("Fou Org membership role does not match the selected account type");
    }

    req.user.role = role;
    await req.user.save();
    return res.status(200).json({ role });
  } catch (error) {
    const status = Number(error.status || error.statusCode);
    console.error("Error completing Fou Org signup:", {
      clerkUserId: req.user.clerkId,
      organizationId: ENV.CLERK_VENDOR_ORGANIZATION_ID || null,
      status: Number.isFinite(status) ? status : null,
      clerkErrors: error.errors?.map(({ code, longMessage }) => ({ code, longMessage })),
      message: error.message,
    });
    const missingOrganization = error.message === "CLERK_VENDOR_ORGANIZATION_ID is not configured";
    const organizationNotFound = status === 404;
    const clerkAccessDenied = status === 401 || status === 403;
    return res.status(missingOrganization ? 503 : 502).json({
      error: missingOrganization
        ? "Signup is temporarily unavailable. Configure CLERK_VENDOR_ORGANIZATION_ID on the server."
        : organizationNotFound
          ? "Fou Org was not found. Set CLERK_VENDOR_ORGANIZATION_ID to the org_... ID from Clerk, not the organization name or slug."
          : clerkAccessDenied
            ? "Clerk denied access to Fou Org. Check the backend CLERK_SECRET_KEY and organization permissions."
            : "Could not verify your Fou Org account role. Check the backend logs and try again.",
    });
  }
}

export async function updateCurrentUserProfile(req, res) {
  try {
    const name = String(req.body?.name || "").trim();
    const imageUrl = String(req.body?.imageUrl || "").trim();

    if (name.length < 2 || name.length > 80) {
      return res.status(400).json({ error: "Name must be between 2 and 80 characters" });
    }
    if (imageUrl.length > 2048 || !imageUrl.startsWith("https://")) {
      return res.status(400).json({ error: "A valid HTTPS profile image URL is required" });
    }

    req.user.name = name;
    req.user.imageUrl = imageUrl;
    await req.user.save();

    res.status(200).json({ message: "Profile updated successfully", user: req.user });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Could not update profile" });
  }
}

export async function addAddress(req, res) {
  try {
    const { label, fullName, streetAddress, city, state, zipCode, phoneNumber, isDefault } =
      req.body;

    const user = req.user;

    if (!fullName || !streetAddress || !city || !state || !zipCode) {
      return res.status(400).json({ error: "Missing required address fields" });
    }

    // if this is set as default, unset all other defaults
    if (isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    user.addresses.push({
      label,
      fullName,
      streetAddress,
      city,
      state,
      zipCode,
      phoneNumber,
      isDefault: isDefault || false,
    });

    await user.save();

    res.status(201).json({ message: "Address added successfully", addresses: user.addresses });
  } catch (error) {
    console.error("Error in addAddress controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getAddresses(req, res) {
  try {
    const user = req.user;

    res.status(200).json({ addresses: user.addresses });
  } catch (error) {
    console.error("Error in getAddresses controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function updateAddress(req, res) {
  try {
    const { label, fullName, streetAddress, city, state, zipCode, phoneNumber, isDefault } =
      req.body;

    const { addressId } = req.params;

    const user = req.user;
    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ error: "Address not found" });
    }

    // if this is set as default, unset all other defaults
    if (isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    address.label = label || address.label;
    address.fullName = fullName || address.fullName;
    address.streetAddress = streetAddress || address.streetAddress;
    address.city = city || address.city;
    address.state = state || address.state;
    address.zipCode = zipCode || address.zipCode;
    address.phoneNumber = phoneNumber || address.phoneNumber;
    address.isDefault = isDefault !== undefined ? isDefault : address.isDefault;

    await user.save();

    res.status(200).json({ message: "Address updated successfully", addresses: user.addresses });
  } catch (error) {
    console.error("Error in updateAddress controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function deleteAddress(req, res) {
  try {
    const { addressId } = req.params;
    const user = req.user;

    user.addresses.pull(addressId);
    await user.save();

    res.status(200).json({ message: "Address deleted successfully", addresses: user.addresses });
  } catch (error) {
    console.error("Error in deleteAddress controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function addToWishlist(req, res) {
  try {
    const { productId } = req.body;
    const user = req.user;

    // check if product is already in the wishlist
    if (user.wishlist.includes(productId)) {
      return res.status(400).json({ error: "Product already in wishlist" });
    }

    user.wishlist.push(productId);
    await user.save();

    res.status(200).json({ message: "Product added to wishlist", wishlist: user.wishlist });
  } catch (error) {
    console.error("Error in addToWishlist controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function removeFromWishlist(req, res) {
  try {
    const { productId } = req.params;
    const user = req.user;

    // check if product is already in the wishlist
    if (!user.wishlist.includes(productId)) {
      return res.status(400).json({ error: "Product not found in wishlist" });
    }

    user.wishlist.pull(productId);
    await user.save();

    res.status(200).json({ message: "Product removed from wishlist", wishlist: user.wishlist });
  } catch (error) {
    console.error("Error in removeFromWishlist controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getWishlist(req, res) {
  try {
    // we're using populate, bc wishlist is just an array of product ids
    const user = await User.findById(req.user._id).populate("wishlist");

    res.status(200).json({ wishlist: user.wishlist });
  } catch (error) {
    console.error("Error in getWishlist controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
