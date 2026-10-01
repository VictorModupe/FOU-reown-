import mongoose from "mongoose";

const checkoutItemSchema = new mongoose.Schema({
  cartItemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String, required: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
});

const vendorPayoutSchema = new mongoose.Schema({
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  subaccountId: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
}, { _id: false });

const shippingAddressSchema = new mongoose.Schema({
  email: { type: String, required: true },
  fullName: { type: String, required: true },
  streetAddress: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  phoneNumber: { type: String, required: true },
});

const checkoutSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    clerkId: { type: String, required: true },
    guestSessionId: { type: String, required: false },
    txRef: { type: String, required: true, unique: true },
    orderItems: { type: [checkoutItemSchema], required: true },
    vendorPayouts: { type: [vendorPayoutSchema], default: [] },
    shippingAddress: { type: shippingAddressSchema, required: true },
    totalPrice: { type: Number, required: true, min: 0 },
    transactionId: { type: String, unique: true, sparse: true },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: false,
    },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

checkoutSessionSchema.index({ guestSessionId: 1, createdAt: -1 });

export const CheckoutSession = mongoose.model("CheckoutSession", checkoutSessionSchema);