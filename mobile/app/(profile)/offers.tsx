import SafeScreen from "@/components/SafeScreen";
import { useCustomerOffers, useUpdateOfferStatus, useVendorOffers } from "@/hooks/useOffers";
import useCurrentUser from "@/hooks/useCurrentUser";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function OffersScreen() {
  const { data: currentUser } = useCurrentUser();
  const isVendor = currentUser?.role === "vendor";
  const customerOffers = useCustomerOffers();
  const vendorOffers = useVendorOffers();
  const updateOffer = useUpdateOfferStatus();
  const offers = isVendor ? vendorOffers.data || [] : customerOffers.data || [];
  const isLoading = isVendor ? vendorOffers.isLoading : customerOffers.isLoading;

  const respondToOffer = (offerId: string, status: "accepted" | "rejected") => {
    updateOffer.mutate({ offerId, status }, {
      onSuccess: () => Alert.alert("Offer updated", `Offer ${status}.`),
      onError: (error: any) => Alert.alert("Could not update offer", error?.response?.data?.message || "Try again."),
    });
  };

  return (
    <SafeScreen>
      <View className="flex-1 px-6 pt-6">
        <View className="mb-6 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4"><Ionicons name="arrow-back" size={24} color="#FFFFFF" /></TouchableOpacity>
          <Text className="text-text-primary text-3xl font-bold">{isVendor ? "Incoming offers" : "My offers"}</Text>
        </View>
        {isLoading ? <ActivityIndicator size="large" color="#1DB954" /> : <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {offers.length === 0 ? <Text className="text-text-secondary text-center mt-12">{isVendor ? "No customer offers yet." : "Your submitted offers will appear here."}</Text> : offers.map((offer) => (
            <View key={offer._id} className="mb-3 rounded-2xl bg-surface p-4">
              <View className="flex-row justify-between"><Text className="text-text-primary flex-1 font-bold">{offer.product.name}</Text><Text className={`font-bold capitalize ${offer.status === "accepted" ? "text-green-500" : offer.status === "rejected" ? "text-red-500" : "text-orange-500"}`}>{offer.status}</Text></View>
              <Text className="text-text-secondary mt-2">Your offer: ₦{offer.offeredPrice.toFixed(2)} x {offer.quantity}</Text>
              <Text className="text-text-secondary mt-1">{isVendor ? `Customer: ${typeof offer.customer === "string" ? "Customer" : offer.customer.name}` : `Seller: ${typeof offer.vendor === "string" ? "Seller" : offer.vendor.name}`}</Text>
              {offer.message ? <Text className="text-text-secondary mt-2">“{offer.message}”</Text> : null}
              {isVendor && offer.status === "pending" ? <View className="mt-4 flex-row gap-3">
                <TouchableOpacity onPress={() => respondToOffer(offer._id, "rejected")} className="flex-1 rounded-xl border border-red-400 py-3"><Text className="text-center font-bold text-red-400">Reject</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => respondToOffer(offer._id, "accepted")} className="flex-1 rounded-xl bg-primary py-3"><Text className="text-center font-bold text-background">Accept</Text></TouchableOpacity>
              </View> : null}
            </View>
          ))}
        </ScrollView>}
      </View>
    </SafeScreen>
  );
}
