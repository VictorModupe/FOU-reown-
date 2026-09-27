import mongoose from "mongoose";
import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";

const getCartOwner = (req) => {
  if (req.user?.clerkId) {
    return { clerkId: req.user.clerkId, user: req.user._id };
  }

  const guestSessionId = req.get("x-guest-session-id");
  if (!guestSessionId || !/^[a-zA-Z0-9-]{16,128}$/.test(guestSessionId)) {
    return null;
  }

  return { clerkId: `guest:${guestSessionId}`, guestSessionId };
};

const findCart = (req) => {
  const owner = getCartOwner(req);
  return owner ? Cart.findOne({ clerkId: owner.clerkId }) : null;
};

const findGuestCart = (req) => {
  const guestSessionId = req.get("x-guest-session-id");
  if (!guestSessionId || !/^[a-zA-Z0-9-]{16,128}$/.test(guestSessionId)) {
    return null;
  }

  return Cart.findOne({ guestSessionId });
};

const createCart = async (req) => {
  const owner = getCartOwner(req);
  if (!owner) return null;
  try {
    return await Cart.findOneAndUpdate(
      { clerkId: owner.clerkId },
      { $setOnInsert: { ...owner, items: [] } },
      { new: true, upsert: true }
    );
  } catch (error) {
    if (error.code !== 11000) throw error;
    return Cart.findOne({ clerkId: owner.clerkId });
  }
};

export async function getCart(req, res) {
  try {
    let cart = await findCart(req);
    if (!getCartOwner(req)) {
      return res.status(400).json({ error: "A guest session is required" });
    }

    if (!cart) {
      cart = await createCart(req);
    }

    if (req.user) {
      const guestCart = await findGuestCart(req);
      if (guestCart && guestCart._id.toString() !== cart._id.toString()) {
        const guestProductIds = guestCart.items.map((item) => item.product);
        const products = await Product.find({ _id: { $in: guestProductIds } }).select("_id stock");
        const stockByProductId = new Map(
          products.map((product) => [product._id.toString(), product.stock])
        );
        const existingProducts = new Map(
          cart.items.map((item) => [item.product.toString(), item])
        );

        for (const guestItem of guestCart.items) {
          const productId = guestItem.product.toString();
          const stock = stockByProductId.get(productId) ?? 0;
          const existingItem = existingProducts.get(productId);
          const mergedQuantity = Math.min(
            (existingItem?.quantity ?? 0) + guestItem.quantity,
            stock
          );
          if (mergedQuantity < 1) continue;

          if (existingItem) {
            existingItem.quantity = mergedQuantity;
          } else {
            cart.items.push({ product: guestItem.product, quantity: mergedQuantity });
          }
        }

        await cart.save();
        await Cart.deleteOne({ _id: guestCart._id });
      }
    }

    await cart.populate("items.product");
    res.status(200).json({ cart });
  } catch (error) {
    console.error("Error in getCart controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function addToCart(req, res) {
  try {
    const { productId, quantity = 1 } = req.body || {};

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ error: "Quantity must be a positive integer" });
    }
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ error: "A valid product is required" });
    }

    // validate product exists and has stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (!getCartOwner(req)) {
      return res.status(400).json({ error: "A guest session is required" });
    }

    for (let attempt = 0; attempt < 3; attempt += 1) {
      let cart = await findCart(req);
      if (!cart) cart = await createCart(req);
      if (!cart) return res.status(400).json({ error: "A guest session is required" });

      const existingItem = cart.items.find((item) => item.product.toString() === productId);
      const newQuantity = (existingItem?.quantity ?? 0) + quantity;
      if (product.stock < newQuantity) {
        return res.status(400).json({ error: "Insufficient stock" });
      }

      if (existingItem) {
        existingItem.quantity = newQuantity;
      } else {
        cart.items.push({ product: productId, quantity });
      }

      try {
        await cart.save();
        await cart.populate("items.product");
        return res.status(200).json({ message: "Item added to cart", cart });
      } catch (error) {
        if (error.name !== "VersionError" || attempt === 2) throw error;
      }
    }

    return res.status(409).json({ error: "Cart changed repeatedly. Please try again." });
  } catch (error) {
    console.error("Error in addToCart controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function updateCartItem(req, res) {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ error: "A valid product is required" });
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ error: "Quantity must be a positive integer" });
    }

    const cart = await findCart(req);
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);
    if (itemIndex === -1) {
      return res.status(404).json({ error: "Item not found in cart" });
    }

    // check if product exists & validate stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ error: "Insufficient stock" });
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();
    await cart.populate("items.product");

    res.status(200).json({ message: "Cart updated successfully", cart });
  } catch (error) {
    console.error("Error in updateCartItem controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function removeFromCart(req, res) {
  try {
    const { productId } = req.params;
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ error: "A valid product is required" });
    }

    const cart = await findCart(req);
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    cart.items = cart.items.filter((item) => item.product.toString() !== productId);
    await cart.save();
    await cart.populate("items.product");

    res.status(200).json({ message: "Item removed from cart", cart });
  } catch (error) {
    console.error("Error in removeFromCart controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export const clearCart = async (req, res) => {
  try {
    const cart = await findCart(req);
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    cart.items = [];
    await cart.save();
    await cart.populate("items.product");

    res.status(200).json({ message: "Cart cleared", cart });
  } catch (error) {
    console.error("Error in clearCart controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
