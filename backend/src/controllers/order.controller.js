import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { Review } from "../models/review.model.js";
import { getGuestSessionId } from "../lib/guest-session.js";

export async function createOrder(req, res) {
  try {
    const user = req.user;
    const { orderItems, shippingAddress, paymentResult, totalPrice } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ error: "No order items" });
    }

    // validate products and stock
    for (const item of orderItems) {
      const product = await Product.findById(item.product._id);
      if (!product) {
        return res.status(404).json({ error: `Product ${item.name} not found` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      }
    }

    const order = await Order.create({
      user: user._id,
      clerkId: user.clerkId,
      orderItems,
      shippingAddress,
      paymentResult,
      totalPrice,
    });

    // update product stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { stock: -item.quantity },
      });
    }

    res.status(201).json({ message: "Order created successfully", order });
  } catch (error) {
    console.error("Error in createOrder controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getUserOrders(req, res) {
  try {
    const orders = await Order.find({ clerkId: req.user.clerkId })
      .populate("orderItems.product")
      .sort({ createdAt: -1 });

    // check if each order has been reviewed

    const orderIds = orders.map((order) => order._id);
    const reviews = await Review.find({ orderId: { $in: orderIds } }).select("orderId productId");
    const reviewedProductsByOrder = new Map();
    for (const review of reviews) {
      const orderId = review.orderId.toString();
      const productIds = reviewedProductsByOrder.get(orderId) ?? new Set();
      productIds.add(review.productId.toString());
      reviewedProductsByOrder.set(orderId, productIds);
    }

    const ordersWithReviewStatus = orders.map((order) => {
      const reviewedProductIds = reviewedProductsByOrder.get(order._id.toString()) ?? new Set();
      const hasReviewed = order.orderItems.every((item) =>
        reviewedProductIds.has(item.product._id.toString())
      );
      return { ...order.toObject(), hasReviewed };
    });

    res.status(200).json({ orders: ordersWithReviewStatus });
  } catch (error) {
    console.error("Error in getUserOrders controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getGuestOrders(req, res) {
  try {
    const guestSessionId = getGuestSessionId(req);
    if (!guestSessionId) {
      return res.status(400).json({ error: "A valid guest session is required" });
    }

    const orders = await Order.find({ guestSessionId })
      .populate("orderItems.product")
      .sort({ createdAt: -1 });

    res.status(200).json({
      orders: orders.map((order) => ({ ...order.toObject(), hasReviewed: false })),
    });
  } catch (error) {
    console.error("Error in getGuestOrders controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
