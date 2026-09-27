import { useAddresses } from "@/hooks/useAddressess";
import { Address, CheckoutAddress } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { View, Text, Modal, TouchableOpacity, ScrollView, ActivityIndicator, TextInput } from "react-native";

interface AddressSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onProceed: (address: CheckoutAddress) => void;
  isProcessing: boolean;
}

const AddressSelectionModal = ({
  visible,
  onClose,
  onProceed,
  isProcessing,
}: AddressSelectionModalProps) => {
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [shippingAddress, setShippingAddress] = useState<CheckoutAddress>({
    email: "",
    fullName: "",
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    phoneNumber: "",
  });
  const { addresses, isLoading: addressesLoading } = useAddresses();
  const hasSavedAddresses = addresses.length > 0;
  const shippingAddressIsValid =
    Boolean(shippingAddress.email?.trim()) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingAddress.email?.trim() || "") &&
    [
      shippingAddress.fullName,
      shippingAddress.streetAddress,
      shippingAddress.city,
      shippingAddress.state,
      shippingAddress.zipCode,
      shippingAddress.phoneNumber,
    ].every((value) => value.trim().length > 0);

  const handleContinue = () => {
    if (hasSavedAddresses && selectedAddress) {
      onProceed(selectedAddress);
    } else if (!hasSavedAddresses && shippingAddressIsValid) {
      onProceed(shippingAddress);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <View className={`bg-background rounded-t-3xl ${hasSavedAddresses ? "h-1/2" : "h-5/6"}`}>
          {/* Modal Header */}
          <View className="flex-row items-center justify-between p-6 border-b border-surface">
            <Text className="text-text-primary text-2xl font-bold">
              {hasSavedAddresses ? "Select Address" : "Shipping Details"}
            </Text>
            <TouchableOpacity onPress={onClose} className="bg-surface rounded-full p-2">
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* ADDRESSES LIST */}
          <ScrollView className="flex-1 p-6">
            {addressesLoading ? (
              <View className="py-8">
                <ActivityIndicator size="large" color="#00D9FF" />
              </View>
            ) : !hasSavedAddresses ? (
              <View className="gap-3">
                {([
                  ["email", "Email address", "email-address"],
                  ["fullName", "Full name", "default"],
                  ["streetAddress", "Street address", "default"],
                  ["city", "City", "default"],
                  ["state", "State / province", "default"],
                  ["zipCode", "ZIP / postal code", "default"],
                  ["phoneNumber", "Phone number", "phone-pad"],
                ] as const).map(([field, label, keyboardType]) => (
                  <TextInput
                    key={field}
                    className="bg-surface text-text-primary px-4 py-3 rounded-xl"
                    placeholder={label}
                    placeholderTextColor="#888"
                    value={shippingAddress[field]}
                    onChangeText={(value) =>
                      setShippingAddress((current) => ({ ...current, [field]: value }))
                    }
                    keyboardType={keyboardType}
                    autoCapitalize={field === "email" ? "none" : "words"}
                    autoComplete={field === "email" ? "email" : "off"}
                  />
                ))}
              </View>
            ) : (
              <View className="gap-4">
                {addresses?.map((address: Address) => (
                  <TouchableOpacity
                    key={address._id}
                    className={`bg-surface rounded-3xl p-6 border-2 ${
                      selectedAddress?._id === address._id
                        ? "border-primary"
                        : "border-background-lighter"
                    }`}
                    activeOpacity={0.7}
                    onPress={() => setSelectedAddress(address)}
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <View className="flex-row items-center mb-3">
                          <Text className="text-primary font-bold text-lg mr-2">
                            {address.label}
                          </Text>
                          {address.isDefault && (
                            <View className="bg-primary/20 rounded-full px-3 py-1">
                              <Text className="text-primary text-sm font-semibold">Default</Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-text-primary font-semibold text-lg mb-2">
                          {address.fullName}
                        </Text>
                        <Text className="text-text-secondary text-base leading-6 mb-1">
                          {address.streetAddress}
                        </Text>
                        <Text className="text-text-secondary text-base mb-2">
                          {address.city}, {address.state} {address.zipCode}
                        </Text>
                        <Text className="text-text-secondary text-base">{address.phoneNumber}</Text>
                      </View>
                      {selectedAddress?._id === address._id && (
                        <View className="bg-primary rounded-full p-2 ml-3">
                          <Ionicons name="checkmark" size={24} color="#121212" />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>

          <View className="p-6 border-t border-surface">
            <TouchableOpacity
              className="bg-primary rounded-2xl py-5"
              activeOpacity={0.9}
              onPress={handleContinue}
              disabled={
                isProcessing ||
                addressesLoading ||
                (hasSavedAddresses ? !selectedAddress : !shippingAddressIsValid)
              }
            >
              <View className="flex-row items-center justify-center">
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#121212" />
                ) : (
                  <>
                    <Text className="text-background font-bold text-lg mr-2">
                      Continue to Payment
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="#121212" />
                  </>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AddressSelectionModal;
