import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { createOrder, getGuestOrders, getUserOrders } from "../controllers/order.controller.js";

const router = Router();

router.post("/", protectRoute, createOrder);
router.get("/guest", getGuestOrders);
router.get("/", protectRoute, getUserOrders);

export default router;
