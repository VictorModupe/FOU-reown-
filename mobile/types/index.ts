import { ViewStyle } from "react-native/Libraries/StyleSheet/StyleSheetTypes";

export interface Product {
  _id: string;
  vendor?: Pick<User, "_id" | "name" | "email">;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  images: string[];
  averageRating: number;
  totalReviews: number;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  _id: string;
  clerkId: string;
  email: string;
  name: string;
  imageUrl: string;
  role: "customer" | "vendor";
  addresses: Address[];
  wishlist: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  _id: string;
  label: string;
  fullName: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  isDefault: boolean;
}

export interface CheckoutAddress {
  email?: string;
  fullName: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
}

export interface FlutterwaveInitCustomer {
  email: string;
  phonenumber?: string;
  name?: string;
}

export interface RedirectParams {
  status: 'successful' | 'cancelled';
  transaction_id?: string;
  tx_ref: string;
}

export interface CustomButtonProps {
  disabled: boolean;
  isInitializing: boolean;
  onPress: () => void;
}

export interface FlutterwaveInitError {
  code: string;
  message: string;
  errorId?: string;
  errors?: Array<string>;
}

export interface FlutterwavePaymentMeta {
  [k: string]: any;
}

export interface FlutterwaveInitCustomizations {
  title?: string;
  logo?: string;
  description?: string;
}

export interface FlutterwaveInitOptions {
  authorization: string;
  tx_ref: string;
  amount: number;
  currency: string;
  integrity_hash?: string;
  payment_options?: string;
  payment_plan?: number;
  redirect_url: string;
  customer: FlutterwaveInitCustomer;
  subaccounts?: Array<FlutterwaveInitSubAccount>;
  meta?: FlutterwavePaymentMeta;
  customizations?: FlutterwaveInitCustomizations;
}

export interface PayWithFlutterwaveProps {
  style?: ViewStyle;
  onRedirect: (data: RedirectParams) => void;
  onWillInitialize?: () => void;
  onDidInitialize?: () => void;
  onInitializeError?: (error: FlutterwaveInitError) => void;
  onAbort?: () => void;
  options: Omit<FlutterwaveInitOptions, 'redirect_url'>;
  customButton?: (props: CustomButtonProps) => React.ReactNode;
  alignLeft?: 'alignLeft' | boolean;
}

export interface FlutterwaveInitSubAccount {
  id: string;
  transaction_split_ratio?: number;
  transaction_charge_type?: string;
  transaction_charge?: number;
}

export interface Order {
  _id: string;
  user?: string;
  clerkId: string;
  guestSessionId?: string;
  orderItems: OrderItem[];
  shippingAddress: {
    email?: string;
    fullName: string;
    streetAddress: string;
    city: string;
    state: string;
    zipCode: string;
    phoneNumber: string;
  };
  paymentResult: {
    id: string;
    status: string;
  };
  totalPrice: number;
  status: "pending" | "shipped" | "delivered";
  hasReviewed: boolean;
  createdAt: string;
  updatedAt: string;
  shippedAt?: string;
  deliveredAt?: string;
}

export interface OrderItem {
  _id: string;
  product: Product;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Review {
  _id: string;
  productId: string;
  userId: string | User;
  orderId: string;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  _id: string;
  product: Product;
  quantity: number;
}

export interface Cart {
  _id: string;
  user: string;
  clerkId: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Offer {
  _id: string;
  customer: User | string;
  vendor: User | string;
  product: Product;
  offeredPrice: number;
  quantity: number;
  message: string;
  status: "pending" | "accepted" | "rejected";
  customerSeen: boolean;
  vendorSeen: boolean;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}
