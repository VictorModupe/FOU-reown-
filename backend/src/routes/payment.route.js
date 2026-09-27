import { Router } from "express";
import { optionalAuth } from "../middleware/auth.middleware.js";
import {
	createFlutterwavePayment,
	handleFlutterwaveWebhook,
	verifyFlutterwavePayment,
} from "../controllers/payment.controller.js";

const router = Router();

router.post("/flutterwave/webhook", handleFlutterwaveWebhook);
router.post("/flutterwave", optionalAuth, createFlutterwavePayment);
router.post("/flutterwave/verify", optionalAuth, verifyFlutterwavePayment);

export default router;
