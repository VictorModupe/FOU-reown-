import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
});

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    clerkId: {
      type: String,
      required: true,
      unique: true,
    },
    guestSessionId: {
      type: String,
      required: false,
    },
    items: [cartItemSchema],
  },
  { timestamps: true, optimisticConcurrency: true }
);

export const Cart = mongoose.model("Cart", cartSchema);
