import AddressCard from "@/components/AddressCard";
import AddressesHeader from "@/components/AddressesHeader";
import AddressFormModal from "@/components/AddressFormModal";
import SafeScreen from "@/components/SafeScreen";
import { useAddresses } from "@/hooks/useAddressess";
import { Address } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";

function AddressesScreen() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const {
    addAddress,
    addresses,
    deleteAddress,
    isAddingAddress,
    isDeletingAddress,
    isError,
    isLoading,
    isRefetching,
    isUpdatingAddress,
    refetch,
    updateAddress,
  } = useAddresses();
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    label: "",
    fullName: "",
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    phoneNumber: "",
    isDefault: false,
  });

  if (!authLoaded) return <LoadingUI />;
  if (!isSignedIn) {
    return (
      <SafeScreen>
        <AddressesHeader />
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="lock-closed-outline" size={64} color="#8264A9" />
          <Text className="mt-4 text-xl font-semibold text-text-primary">Sign in to manage addresses</Text>
          <Text className="mt-2 text-center text-text-secondary">Saved delivery addresses are available with your account.</Text>
          <TouchableOpacity className="mt-6 rounded-2xl bg-primary px-8 py-4" onPress={() => router.push("/(routes)/login")}>
            <Text className="font-bold text-background">Sign in</Text>
          </TouchableOpacity>
        </View>
      </SafeScreen>
    );
  }

  const handleAddAddress = () => {
    setShowAddressForm(true);
    setEditingAddressId(null);
    setAddressForm({
      label: "",
      fullName: "",
      streetAddress: "",
      city: "",
      state: "",
      zipCode: "",
      phoneNumber: "",
      isDefault: false,
    });
  };

  const handleEditAddress = (address: Address) => {
    setShowAddressForm(true);
    setEditingAddressId(address._id);
    setAddressForm({
      label: address.label,
      fullName: address.fullName,
      streetAddress: address.streetAddress,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      phoneNumber: address.phoneNumber,
      isDefault: address.isDefault,
    });
  };

  const handleDeleteAddress = (addressId: string, label: string) => {
    Alert.alert("Delete Address", `Are you sure you want to delete ${label}`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteAddress(addressId) },
    ]);
  };

  const handleSaveAddress = () => {
    if (
      !addressForm.label ||
      !addressForm.fullName ||
      !addressForm.streetAddress ||
      !addressForm.city ||
      !addressForm.state ||
      !addressForm.zipCode ||
      !addressForm.phoneNumber
    ) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (editingAddressId) {
      // update an existing address
      updateAddress(
        {
          addressId: editingAddressId,
          addressData: addressForm,
        },
        {
          onSuccess: () => {
            setShowAddressForm(false);
            setEditingAddressId(null);
            Alert.alert("Success", "Address updated successfully");
          },
          onError: (error: any) => {
            Alert.alert("Error", error?.response?.data?.error || "Failed to update address");
          },
        }
      );
    } else {
      // create new address
      addAddress(addressForm, {
        onSuccess: () => {
          setShowAddressForm(false);
          Alert.alert("Success", "Address added successfully");
        },
        onError: (error: any) => {
          Alert.alert("Error", error?.response?.data?.error || "Failed to add address");
        },
      });
    }
  };

  const handleCloseAddressForm = () => {
    setShowAddressForm(false);
    setEditingAddressId(null);
  };

  if (isLoading) return <LoadingUI />;

  return (
    <SafeScreen>
      <AddressesHeader />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor="#8264A9"
            colors={["#8264A9"]}
          />
        }
      >
      {isError ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle-outline" size={64} color="#FF6B6B" />
          <Text className="mt-4 text-xl font-semibold text-text-primary">Failed to load addresses</Text>
          <Text className="mt-2 text-center text-text-secondary">Pull down to try again.</Text>
          <TouchableOpacity className="mt-6 rounded-2xl bg-primary px-8 py-4" onPress={() => void refetch()}>
            <Text className="font-bold text-background">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : addresses.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="location-outline" size={80} color="#666" />
          <Text className="text-text-primary font-semibold text-xl mt-4">No addresses yet</Text>
          <Text className="text-text-secondary text-center mt-2">
            Add your first delivery address
          </Text>
          <TouchableOpacity
            className="bg-primary rounded-2xl px-8 py-4 mt-6"
            activeOpacity={0.8}
            onPress={handleAddAddress}
          >
            <Text className="text-background font-bold text-base">Add Address</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="px-6 py-4">
          {addresses.map((address) => (
            <AddressCard
              key={address._id}
              address={address}
              onEdit={handleEditAddress}
              onDelete={handleDeleteAddress}
              isUpdatingAddress={isUpdatingAddress}
              isDeletingAddress={isDeletingAddress}
            />
          ))}

          <TouchableOpacity
            className="bg-primary rounded-2xl py-4 items-center mt-2"
            activeOpacity={0.8}
            onPress={handleAddAddress}
          >
            <View className="flex-row items-center">
              <Ionicons name="add-circle-outline" size={24} color="#121212" />
              <Text className="text-background font-bold text-base ml-2">Add New Address</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}
      </ScrollView>

      <AddressFormModal
        visible={showAddressForm}
        isEditing={!!editingAddressId}
        addressForm={addressForm}
        isAddingAddress={isAddingAddress}
        isUpdatingAddress={isUpdatingAddress}
        onClose={handleCloseAddressForm}
        onSave={handleSaveAddress}
        onFormChange={setAddressForm}
      />
    </SafeScreen>
  );
}
export default AddressesScreen;

function LoadingUI() {
  return (
    <SafeScreen>
      <AddressesHeader />
      <View className="flex-1 items-center justify-center px-6">
        <ActivityIndicator size="large" color="#00D9FF" />
        <Text className="text-text-secondary mt-4">Loading addresses...</Text>
      </View>
    </SafeScreen>
  );
}
