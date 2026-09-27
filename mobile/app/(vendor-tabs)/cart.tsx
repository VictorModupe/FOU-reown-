import SafeScreen from "@/components/SafeScreen";
import useCart from "@/hooks/useCart";
import { useApi } from "@/lib/api";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useState } from "react";
import { CheckoutAddress } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import OrderSummary from "@/components/OrderSummary";
import AddressSelectionModal from "@/components/AddressSelectionModal";
import Toast from "react-native-toast-message";
import { PayWithFlutterwave } from "flutterwave-react-native";
import type { RedirectParams } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";

const CartScreen = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  const {
    cart,
    cartItemCount,
    cartTotal,
    isError,
    isLoading,
    isRemoving,
    isUpdating,
    removeFromCart,
    updateQuantity,
  } = useCart();
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [paymentOptions, setPaymentOptions] = useState<React.ComponentProps<typeof PayWithFlutterwave>["options"] | null>(null);
  const [pendingTransactionId, setPendingTransactionId] = useState<string | null>(null);

  const cartItems = cart?.items || [];
  const subtotal = cartTotal;
  const shipping = 10.0; // $10 shipping fee
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;

  const handleQuantityChange = (productId: string, currentQuantity: number, change: number) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity < 1) return;
    setPaymentOptions(null);
    updateQuantity(
      { productId, quantity: newQuantity },
      {
        onError: (error: any) =>
          Alert.alert("Cart update failed", error?.response?.data?.error || "Please try again."),
      }
    );
  };

  const handleRemoveItem = (productId: string, productName: string) => {
    Alert.alert("Remove Item", `Remove ${productName} from cart?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          setPaymentOptions(null);
          removeFromCart(productId, {
            onError: (error: any) =>
              Alert.alert("Remove failed", error?.response?.data?.error || "Please try again."),
          });
        },
      },
    ]);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    setAddressModalVisible(true);
  };

  const handleProceedWithPayment = async (selectedAddress: CheckoutAddress) => {
    await handlePayment(selectedAddress);
  };

  const handlePayment = async (address: CheckoutAddress) => {
    setPaymentLoading(true);

    try {
      const shippingAddress = {
        email: address.email,
        fullName: address.fullName,
        streetAddress: address.streetAddress,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        phoneNumber: address.phoneNumber,
      };

      const { data } = await api.post("/payment/flutterwave", { shippingAddress });
      setPaymentOptions(data.options);
      setAddressModalVisible(false);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Payment failed",
        text2: error?.response?.data?.error || error?.message || "Please try again.",
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  const verifyTransaction = async (transactionId: string) => {
    setPaymentLoading(true);
    try {
      const { data: verification } = await api.post("/payment/flutterwave/verify", {
        transactionId,
      });
      await queryClient.invalidateQueries({ queryKey: ["cart"] });
      await queryClient.invalidateQueries({ queryKey: ["orders"] });
      setPendingTransactionId(null);
      Toast.show({
        type: "success",
        text1: "Payment successful",
        text2: `Order #${String(verification.orderId).slice(-8).toUpperCase()} is being prepared.`,
      });
      router.push("/orders");
    } catch (error: any) {
      const status = error?.response?.status;
      const terminalFailure = status >= 400 && status < 500 && status !== 408 && status !== 429;
      if (terminalFailure) {
        setPendingTransactionId(null);
        Toast.show({
          type: "error",
          text1: "Payment needs attention",
          text2: error?.response?.data?.error || "Please contact support before trying to pay again.",
        });
      } else {
        setPendingTransactionId(transactionId);
        Toast.show({
          type: "error",
          text1: "Order confirmation pending",
          text2: "Flutterwave reported success, but confirmation could not finish. Retry confirmation; do not pay again.",
        });
      }
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleFlutterwaveRedirect = async (result: RedirectParams) => {
    setPaymentOptions(null);
    if (result.status !== "successful" || !result.transaction_id) {
      Toast.show({ type: "error", text1: "Payment cancelled", text2: "No payment was completed." });
      return;
    }

    setPendingTransactionId(result.transaction_id);
    await verifyTransaction(result.transaction_id);
  };

  if (isLoading) return <LoadingUI />;
  if (isError) return <ErrorUI />;
  if (cartItems.length === 0) return <EmptyUI />;

  return (
    <SafeScreen>
      <Text className="px-6 pb-5 text-text-primary text-3xl font-bold tracking-tight">Cart</Text>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 240 }}
      >
        <View className="px-6 gap-2">
          {cartItems.map((item, index) => (
            <View key={item._id} className="bg-surface rounded-3xl overflow-hidden ">
              <View className="p-4 flex-row">
                {/* product image */}
                <View className="relative">
                  <Image
                    source={item.product.images[0]}
                    className="bg-background-lighter"
                    contentFit="cover"
                    style={{ width: 112, height: 112, borderRadius: 16 }}
                  />
                  <View className="absolute top-2 right-2 bg-primary rounded-full px-2 py-0.5">
                    <Text className="text-background text-xs font-bold">×{item.quantity}</Text>
                  </View>
                </View>

                <View className="flex-1 ml-4 justify-between">
                  <View>
                    <Text
                      className="text-text-primary font-bold text-lg leading-tight"
                      numberOfLines={2}
                    >
                      {item.product.name}
                    </Text>
                    <View className="flex-row items-center mt-2">
                      <Text className="text-primary font-bold text-2xl">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </Text>
                      <Text className="text-text-secondary text-sm ml-2">
                        ${item.product.price.toFixed(2)} each
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center mt-3">
                    <TouchableOpacity
                      className="bg-background-lighter rounded-full w-9 h-9 items-center justify-center"
                      activeOpacity={0.7}
                      onPress={() => handleQuantityChange(item.product._id, item.quantity, -1)}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Ionicons name="remove" size={18} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>

                    <View className="mx-4 min-w-[32px] items-center">
                      <Text className="text-text-primary font-bold text-lg">{item.quantity}</Text>
                    </View>

                    <TouchableOpacity
                      className="bg-primary rounded-full w-9 h-9 items-center justify-center"
                      activeOpacity={0.7}
                      onPress={() => handleQuantityChange(item.product._id, item.quantity, 1)}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <ActivityIndicator size="small" color="#8264A9" />
                      ) : (
                        <Ionicons name="add" size={18} color="#8264A9" />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="ml-auto bg-red-500/10 rounded-full w-9 h-9 items-center justify-center"
                      activeOpacity={0.7}
                      onPress={() => handleRemoveItem(item.product._id, item.product.name)}
                      disabled={isRemoving}
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        <OrderSummary subtotal={subtotal} shipping={shipping} tax={tax} total={total} />
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t
       border-surface pt-4 pb-32 px-6"
      >
        {/* Quick Stats */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <Ionicons name="cart" size={20} color="#8264A9" />
            <Text className="text-text-secondary ml-2">
              {cartItemCount} {cartItemCount === 1 ? "item" : "items"}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-text-primary font-bold text-xl">${total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Checkout Button */}
        {pendingTransactionId ? (
          <TouchableOpacity
            className="bg-primary rounded-2xl overflow-hidden"
            activeOpacity={0.9}
            onPress={() => void verifyTransaction(pendingTransactionId)}
            disabled={paymentLoading}
          >
            <View className="py-5 flex-row items-center justify-center">
              {paymentLoading ? (
                <ActivityIndicator size="small" color="#8264A9" />
              ) : (
                <Text className="text-background font-bold text-lg">Retry order confirmation</Text>
              )}
            </View>
          </TouchableOpacity>
        ) : paymentOptions ? (
          <PayWithFlutterwave
            options={paymentOptions}
            onRedirect={handleFlutterwaveRedirect}
            onWillInitialize={() => setPaymentLoading(true)}
            onDidInitialize={() => setPaymentLoading(false)}
            onAbort={() => {
              setPaymentOptions(null);
              setPaymentLoading(false);
            }}
            onInitializeError={(error) => {
              setPaymentOptions(null);
              setPaymentLoading(false);
              Toast.show({
                type: "error",
                text1: "Payment could not start",
                text2: error.message || "Please try again.",
              });
            }}
            customButton={(props) => (
              <TouchableOpacity
                className="bg-primary rounded-2xl overflow-hidden"
                activeOpacity={0.9}
                onPress={props.onPress}
                disabled={props.disabled || paymentLoading}
              >
                <View className="py-5 flex-row items-center justify-center">
                  {paymentLoading ? (
                    <ActivityIndicator size="small" color="#8264A9" />
                  ) : (
                    <>
                      <Text className="text-background font-bold text-lg mr-2">Pay ${total.toFixed(2)}</Text>
                      <Ionicons name="arrow-forward" size={20} color="#8264A9" />
                    </>
                  )}
                </View>
              </TouchableOpacity>
            )}
          />
        ) : (
          <TouchableOpacity
            className="bg-primary rounded-2xl overflow-hidden"
            activeOpacity={0.9}
            onPress={handleCheckout}
            disabled={paymentLoading}
          >
            <View className="py-5 flex-row items-center justify-center">
              {paymentLoading ? <ActivityIndicator size="small" color="#8264A9" /> : <Text className="text-background font-bold text-lg">Checkout</Text>}
            </View>
          </TouchableOpacity>
        )}
      </View>

      <AddressSelectionModal
        visible={addressModalVisible}
        onClose={() => setAddressModalVisible(false)}
        onProceed={handleProceedWithPayment}
        isProcessing={paymentLoading}
      />
    </SafeScreen>
  );
};

export default CartScreen;

function LoadingUI() {
  return (
    <View className="flex-1 bg-background items-center justify-center">
      <ActivityIndicator size="large" color="#00D9FF" />
      <Text className="text-text-secondary mt-4">Loading cart...</Text>
    </View>
  );
}

function ErrorUI() {
  return (
    <View className="flex-1 bg-background items-center justify-center px-6">
      <Ionicons name="alert-circle-outline" size={64} color="#FF6B6B" />
      <Text className="text-text-primary font-semibold text-xl mt-4">Failed to load cart</Text>
      <Text className="text-text-secondary text-center mt-2">Please check your connection and try again</Text>
    </View>
  );
}

function EmptyUI() {
  return (
    <View className="flex-1 bg-background">
      <View className="px-6 pt-16 pb-5">
        <Text className="text-text-primary text-3xl font-bold tracking-tight">Cart</Text>
      </View>
      <View className="flex-1 items-center justify-center px-6">
        <Ionicons name="cart-outline" size={80} color="#666" />
        <Text className="text-text-primary font-semibold text-xl mt-4">Your cart is empty</Text>
        <Text className="text-text-secondary text-center mt-2">
          Add some products to get started
        </Text>
      </View>
    </View>
  );
}
