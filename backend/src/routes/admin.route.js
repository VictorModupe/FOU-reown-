import { Router } from "express";
import {
  createProduct,
  getAllCustomers,
  getAllOrders,
  getAllProducts,
  getDashboardStats,
  updateOrderStatus,
  updateProduct,
  deleteProduct,
  getVendors,
  updateUserRole,
} from "../controllers/admin.controller.js";
import { adminOnly, protectRoute, vendorOrAdmin } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import { getVendorOffers, updateOfferStatus } from "../controllers/offer.controller.js";
import {
  connectVendorPayoutAccount,
  getVendorBanks,
  getVendorEarnings,
  getVendorPayoutAccount,
} from "../controllers/payout.controller.js";

const router = Router();

// optimization - DRY
router.use(protectRoute);

router.post("/products", vendorOrAdmin, upload.array("images", 3), createProduct);
router.get("/products", vendorOrAdmin, getAllProducts);
router.put("/products/:id", vendorOrAdmin, upload.array("images", 3), updateProduct);
router.delete("/products/:id", vendorOrAdmin, deleteProduct);

router.get("/orders", vendorOrAdmin, getAllOrders);
router.get("/earnings", vendorOrAdmin, getVendorEarnings);
router.get("/payout-account", vendorOrAdmin, getVendorPayoutAccount);
router.get("/payout-banks/:country", vendorOrAdmin, getVendorBanks);
router.post("/payout-account", vendorOrAdmin, connectVendorPayoutAccount);
router.patch("/orders/:orderId/status", vendorOrAdmin, updateOrderStatus);
router.get("/offers", vendorOrAdmin, getVendorOffers);
router.patch("/offers/:offerId", vendorOrAdmin, updateOfferStatus);

router.get("/customers", adminOnly, getAllCustomers);
router.get("/vendors", adminOnly, getVendors);
router.patch("/users/:userId/role", adminOnly, updateUserRole);

router.get("/stats", adminOnly, getDashboardStats);

// PUT: Used for full resource replacement, updating the entire resource
// PATCH: Used for partial resource updates, updating a specific part of the resource

export default router;
