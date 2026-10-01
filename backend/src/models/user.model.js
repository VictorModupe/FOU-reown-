import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  streetAddress: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  zipCode: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
});

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["customer", "vendor", "admin"],
      default: "customer",
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      default: "",
    },
    clerkId: {
      type: String,
      unique: true,
      required: true,
    },
    addresses: [addressSchema],
    flutterwavePayout: {
      subaccountId: { type: String, select: false },
      country: String,
      bankCode: String,
      bankName: String,
      accountName: String,
      accountLast4: String,
      businessMobile: String,
      connectedAt: Date,
    },
    wishlist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
