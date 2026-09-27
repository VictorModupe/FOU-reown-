import { randomUUID } from "node:crypto";
import { ENV } from "../config/env.js";
import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";
import { CheckoutSession } from "../models/checkout-session.model.js";
import { getGuestSessionId } from "../lib/guest-session.js";

const getPaymentOwner = (req) => {
  if (req.user?.clerkId) {
    return {
      user: req.user,
      clerkId: req.user.clerkId,
      cartFilter: { user: req.user._id },
    };
  }

  const guestSessionId = getGuestSessionId(req);
  if (!guestSessionId) return null;

  return {
    guestSessionId,
    clerkId: `guest:${guestSessionId}`,
    cartFilter: { guestSessionId },
  };
};

const ownsCheckout = (checkout, owner) => {
  if (owner.user) {
    return checkout.user?.toString() === owner.user._id.toString() &&
      checkout.clerkId === owner.clerkId;
  }

  return !checkout.user &&
    checkout.guestSessionId === owner.guestSessionId &&
    checkout.clerkId === owner.clerkId;
};

const normalizeShippingAddress = (address, fallbackEmail) => {
  if (!address || typeof address !== "object") return null;

  const normalized = {
    email: String(fallbackEmail || address.email || "").trim().toLowerCase(),
    fullName: String(address.fullName || "").trim(),
    streetAddress: String(address.streetAddress || "").trim(),
    city: String(address.city || "").trim(),
    state: String(address.state || "").trim(),
    zipCode: String(address.zipCode || "").trim(),
    phoneNumber: String(address.phoneNumber || "").trim(),
  };

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email)) return null;
  if (Object.values(normalized).some((value) => !value)) return null;
  return normalized;
};

const amountInCents = (amount) => Math.round(Number(amount) * 100);

const restoreReservedStock = async (items) => {
  for (const item of [...items].reverse()) {
    await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } });
  }
};

const reserveOrderStock = async (items) => {
  const reservedItems = [];
  try {
    for (const item of items) {
      const product = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: false }
      );
      if (!product) {
        await restoreReservedStock(reservedItems);
        return false;
      }
      reservedItems.push(item);
    }
    return reservedItems;
  } catch (error) {
    await restoreReservedStock(reservedItems);
    throw error;
  }
};

const removePurchasedCartItems = async (owner, orderItems) => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const cart = await Cart.findOne(owner.cartFilter);
    if (!cart) return;

    let changed = false;
    for (const purchasedItem of orderItems) {
      const cartItem = cart.items.id(purchasedItem.cartItemId);
      if (!cartItem) continue;

      if (cartItem.quantity <= purchasedItem.quantity) {
        cart.items = cart.items.filter(
          (item) => item._id.toString() !== purchasedItem.cartItemId.toString()
        );
      } else {
        cartItem.quantity -= purchasedItem.quantity;
      }
      changed = true;
    }

    if (!changed) return;
    try {
      await cart.save();
      return;
    } catch (error) {
      if (error.name !== "VersionError" || attempt === 2) throw error;
    }
  }
};

const finishCheckout = async (checkout, owner, order) => {
  const completion = await CheckoutSession.findOneAndUpdate(
    { _id: checkout._id, status: "pending" },
    { $set: { status: "completed", order: order._id } },
    { new: true }
  );
  if (completion) await removePurchasedCartItems(owner, checkout.orderItems);
  return { orderId: order._id, status: "success" };
};

export async function createFlutterwavePayment(req, res) {
  try {
    if (!ENV.FLUTTERWAVE_SECRET_KEY) {
      return res.status(503).json({ error: "Flutterwave is not configured. Set FLUTTERWAVE_SECRET_KEY in backend/.env." });
    }

    if (!ENV.FLUTTERWAVE_PUBLIC_KEY) {
      return res.status(503).json({ error: "Flutterwave public key is not configured." });
    }

    const owner = getPaymentOwner(req);
    if (!owner) return res.status(400).json({ error: "A guest session is required" });

    const shippingAddress = normalizeShippingAddress(req.body?.shippingAddress, owner.user?.email);
    if (!shippingAddress) {
      return res.status(400).json({ error: "Enter a valid email and complete shipping address" });
    }

    const cart = await Cart.findOne(owner.cartFilter).populate("items.product");
    if (!cart?.items?.length) return res.status(400).json({ error: "Cart is empty" });

    let subtotal = 0;
    const orderItems = [];
    for (const item of cart.items) {
      const product = item.product;
      if (!product) return res.status(404).json({ error: "A product in your cart no longer exists" });
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        return res.status(400).json({ error: "Cart contains an invalid quantity" });
      }
      if (product.stock < item.quantity) return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      if (!Number.isFinite(product.price) || product.price < 0 || !product.images?.[0]) {
        return res.status(400).json({ error: `Product ${product.name} cannot be purchased right now` });
      }
      subtotal += product.price * item.quantity;
      orderItems.push({
        cartItemId: item._id,
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.images[0],
      });
    }

    const total = Math.round((subtotal + 10 + subtotal * 0.08) * 100) / 100;
    const txRef = `reown-${randomUUID()}`;
    const checkout = await CheckoutSession.create({
      user: owner.user?._id,
      clerkId: owner.clerkId,
      guestSessionId: owner.guestSessionId,
      txRef,
      orderItems,
      shippingAddress,
      totalPrice: total,
    });

    return res.status(200).json({
      options: {
        authorization: ENV.FLUTTERWAVE_PUBLIC_KEY,
        tx_ref: txRef,
        amount: Number(total.toFixed(2)),
        currency: "USD",
        payment_options: "card,banktransfer,ussd",
        customer: {
          email: shippingAddress.email,
          name: shippingAddress.fullName,
          phonenumber: shippingAddress.phoneNumber,
        },
        customizations: { title: "Reown checkout" },
        meta: { checkoutSessionId: checkout._id.toString() },
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
    const owner = getPaymentOwner(req);
    if (!owner) return res.status(400).json({ error: "A guest session is required" });

    const transactionId = String(req.body?.transactionId || "").trim();
    if (!/^\d+$/.test(transactionId)) {
      return res.status(400).json({ error: "Flutterwave transaction is missing or invalid" });
    }

    const response = await fetch(`https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transactionId)}/verify`, {
      headers: { Authorization: `Bearer ${ENV.FLUTTERWAVE_SECRET_KEY}` },
    });
    const result = await response.json();
    const transaction = result.data;
    if (!response.ok || result.status !== "success" || transaction?.status !== "successful") {
      return res.status(400).json({ error: "Flutterwave payment was not successful" });
    }

    const checkoutSessionId = transaction.meta?.checkoutSessionId;
    if (!/^[a-f\d]{24}$/i.test(String(checkoutSessionId || ""))) {
      return res.status(400).json({ error: "Flutterwave checkout reference is invalid" });
    }

    const checkout = await CheckoutSession.findById(checkoutSessionId);
    if (!checkout || !ownsCheckout(checkout, owner)) {
      return res.status(403).json({ error: "Payment checkout does not belong to this customer" });
    }
    if (transaction.tx_ref !== checkout.txRef) {
      return res.status(400).json({ error: "Flutterwave transaction reference mismatch" });
    }
    if (String(transaction.currency).toUpperCase() !== "USD" ||
      amountInCents(transaction.amount) !== amountInCents(checkout.totalPrice)) {
      return res.status(400).json({ error: "Flutterwave payment amount or currency mismatch" });
    }
    if (checkout.transactionId && checkout.transactionId !== transactionId) {
      return res.status(409).json({ error: "A different transaction was already used for this checkout" });
    }

    const existingOrder = await Order.findOne({ checkoutSession: checkout._id });
    if (existingOrder) {
      return res.status(200).json(await finishCheckout(checkout, owner, existingOrder));
    }

    if (checkout.status !== "pending") {
      return res.status(409).json({ error: "This checkout has already been processed" });
    }
    let updatedCheckout;
    try {
      updatedCheckout = await CheckoutSession.findOneAndUpdate(
        {
          _id: checkout._id,
          status: "pending",
          $or: [{ transactionId: { $exists: false } }, { transactionId }],
        },
        { $set: { transactionId } },
        { new: true }
      );
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ error: "This transaction has already been applied" });
      }
      throw error;
    }
    if (!updatedCheckout) {
      return res.status(409).json({ error: "A different transaction was already used for this checkout" });
    }

    const reservedItems = await reserveOrderStock(checkout.orderItems);
    if (!reservedItems) {
      const completedOrder = await Order.findOne({ checkoutSession: checkout._id });
      if (completedOrder) {
        return res.status(200).json(await finishCheckout(checkout, owner, completedOrder));
      }
      return res.status(409).json({ error: "Stock changed during payment. Contact support to complete your order or request a refund." });
    }

    let order;
    try {
      order = await Order.create({
        user: owner.user?._id,
        clerkId: owner.clerkId,
        guestSessionId: owner.guestSessionId,
        checkoutSession: checkout._id,
        orderItems: checkout.orderItems,
        shippingAddress: checkout.shippingAddress,
        paymentResult: { id: transactionId, status: "succeeded" },
        totalPrice: checkout.totalPrice,
      });
    } catch (error) {
      await restoreReservedStock(reservedItems);
      if (error.code === 11000) {
        const duplicateOrder = await Order.findOne({ checkoutSession: checkout._id });
        if (duplicateOrder) {
          return res.status(200).json(await finishCheckout(checkout, owner, duplicateOrder));
        }
      }
      throw error;
    }

    return res.status(200).json(await finishCheckout(checkout, owner, order));
  } catch (error) {
    console.error("Error verifying Flutterwave payment:", error);
    return res.status(500).json({ error: "Failed to verify Flutterwave payment" });
  }
}