import { clerkClient } from "@clerk/express";
import { ENV } from "../config/env.js";

const getOrganizationId = () => {
  if (!ENV.CLERK_VENDOR_ORGANIZATION_ID) {
    throw new Error("CLERK_VENDOR_ORGANIZATION_ID is not configured");
  }
  return ENV.CLERK_VENDOR_ORGANIZATION_ID;
};

const getFouOrganizationMembership = async (clerkUserId) => {
  const memberships = await clerkClient.organizations.getOrganizationMembershipList({
    organizationId: getOrganizationId(),
    userId: [clerkUserId],
    limit: 1,
  });
  return memberships.data[0] || null;
}

export async function getFouOrganizationAppRole(clerkUserId) {
  const membership = await getFouOrganizationMembership(clerkUserId);
  const role = membership?.publicMetadata?.appRole;
  return role === "vendor" || role === "customer" ? role : null;
}

export async function ensureFouOrganizationMembership(clerkUserId, appRole) {
  const organizationId = getOrganizationId();
  let membership = await getFouOrganizationMembership(clerkUserId);

  if (!membership) {
    try {
      membership = await clerkClient.organizations.createOrganizationMembership({
        organizationId,
        userId: clerkUserId,
        role: "org:member",
      });
    } catch (error) {
      membership = await getFouOrganizationMembership(clerkUserId);
      if (!membership) throw error;
    }
  }

  await clerkClient.organizations.updateOrganizationMembershipMetadata({
    organizationId,
    userId: clerkUserId,
    publicMetadata: { ...membership.publicMetadata, appRole },
  });
}

export async function hasVendorOrganizationMembership(clerkUserId) {
  return (await getFouOrganizationAppRole(clerkUserId)) === "vendor";
}
