import { ENV } from "../config/env.js";
import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";

export async function createFlutterwavePayment(req, res) {
  try {
    if (!ENV.FLUTTERWAVE_SECRET_KEY) {
      return res.status(503).json({ error: "Flutterwave is not configured. Set FLUTTERWAVE_SECRET_KEY in backend/.env." });
    }

    const { shippingAddress } = req.body;
    const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
    if (!cart?.items?.length) return res.status(400).json({ error: "Cart is empty" });

    let subtotal = 0;
    const orderItems = [];
    for (const item of cart.items) {
      const product = item.product;
      if (!product) return res.status(404).json({ error: "A product in your cart no longer exists" });
      if (product.stock < item.quantity) return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      subtotal += product.price * item.quantity;
      orderItems.push({ product: product._id, name: product.name, price: product.price, quantity: item.quantity, image: product.images[0] });
    }

    const total = subtotal + 10 + subtotal * 0.08;
    const user = req.user;
    if (!ENV.FLUTTERWAVE_PUBLIC_KEY) {
      return res.status(503).json({ error: "Flutterwave public key is not configured." });
    }

    const txRef = `reown-${user._id}-${Date.now()}`;
    return res.status(200).json({
      options: {
        authorization: ENV.FLUTTERWAVE_PUBLIC_KEY,
        tx_ref: txRef,
        amount: Number(total.toFixed(2)),
        currency: "USD",
        payment_options: "card,banktransfer,ussd",
        customer: { email: user.email, name: user.name, phonenumber: shippingAddress.phoneNumber },
        customizations: { title: "Reown checkout" },
        meta: { userId: user._id.toString(), clerkId: user.clerkId, orderItems, shippingAddress, totalPrice: total.toFixed(2) },
      },
    });
  } catch (error) {
    console.error("Error creating Flutterwave payment:", error);
    return res.status(500).json({ error: "Failed to create Flutterwave payment" });
  }
}

export async function verifyFlutterwavePayment(req, res) {
  try {
    if (!ENV.FLUTTERWAVE_SECRET_KEY) return res.status(503).json({ error: "Flutterwave is not configured" });
    const transactionId = req.body?.transactionId;
    if (!transactionId) return res.status(400).json({ error: "Flutterwave transaction is missing" });

    const response = await fetch(`https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transactionId)}/verify`, {
      headers: { Authorization: `Bearer ${ENV.FLUTTERWAVE_SECRET_KEY}` },
    });
    const result = await response.json();
    const transaction = result.data;
    if (!response.ok || result.status !== "success" || transaction?.status !== "successful") {
      return res.status(400).json({ error: "Flutterwave payment was not successful" });
    }

    const metadata = transaction.meta || {};
    if (metadata.userId !== req.user._id.toString()) return res.status(403).json({ error: "Payment user mismatch" });
    if (transaction.currency !== "USD" || Number(transaction.amount) !== Number(metadata.totalPrice)) {
      return res.status(400).json({ error: "Flutterwave payment amount or currency mismatch" });
    }
    if (!transaction.tx_ref || !transaction.tx_ref.startsWith(`reown-${req.user._id}-`)) {
      return res.status(400).json({ error: "Flutterwave transaction reference mismatch" });
    }
    if (!Array.isArray(metadata.orderItems) || metadata.orderItems.length === 0 || !metadata.shippingAddress) {
      return res.status(400).json({ error: "Flutterwave payment metadata is incomplete" });
    }
    const existingOrder = await Order.findOne({ "paymentResult.id": String(transaction.id) });
    if (existingOrder) {
      await Cart.updateOne({ user: req.user._id }, { $set: { items: [] } });
      return res.status(200).json({ orderId: existingOrder._id, status: "success" });
    }

    const order = await Order.create({
      user: metadata.userId,
      clerkId: metadata.clerkId,
      orderItems: metadata.orderItems,
      shippingAddress: metadata.shippingAddress,
      paymentResult: { id: String(transaction.id), status: "succeeded" },
      totalPrice: Number(metadata.totalPrice),
    });
    for (const item of metadata.orderItems) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
    }
    await Cart.updateOne({ user: req.user._id }, { $set: { items: [] } });
    return res.status(200).json({ orderId: order._id, status: "success" });
  } catch (error) {
    console.error("Error verifying Flutterwave payment:", error);
    return res.status(500).json({ error: "Failed to verify Flutterwave payment" });
  }
}