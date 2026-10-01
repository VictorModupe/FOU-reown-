import SafeScreen from "@/components/SafeScreen";
import { useApi } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

type PayoutAccount = {
  country: string;
  bankName: string;
  accountName: string;
  accountLast4: string;
  connectedAt: string;
};

type VendorPayout = {
  orderId: string;
  transactionId: string;
  amount: number;
  status: "routed";
  createdAt: string;
};

type Bank = { code: string; name: string };

const formatAmount = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

export default function EarningsScreen() {
  const api = useApi();
  const { isLoaded, isSignedIn, userId } = useAuth();
  const queryClient = useQueryClient();
  const [country, setCountry] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [businessMobile, setBusinessMobile] = useState("");
  const [bankPickerOpen, setBankPickerOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(false);

  const accountQuery = useQuery({
    queryKey: ["vendor-payout-account", userId],
    queryFn: async () => (await api.get("/admin/payout-account")).data.payoutAccount as PayoutAccount | null,
    enabled: isLoaded && isSignedIn,
  });
  const earningsQuery = useQuery({
    queryKey: ["vendor-earnings", userId],
    queryFn: async () => (await api.get("/admin/earnings")).data as { totalRouted: number; payouts: VendorPayout[] },
    enabled: isLoaded && isSignedIn,
  });
  const banksQuery = useQuery({
    queryKey: ["flutterwave-banks", country],
    queryFn: async () => (await api.get(`/admin/payout-banks/${country}`)).data.banks as Bank[],
    enabled: isLoaded && isSignedIn && /^[A-Z]{2}$/.test(country),
  });

  const saveAccount = useMutation({
    mutationFn: async () => (await api.post("/admin/payout-account", {
      country,
      bankCode,
      accountNumber,
      businessMobile,
    })).data.payoutAccount as PayoutAccount,
    onSuccess: async (account) => {
      queryClient.setQueryData(["vendor-payout-account", userId], account);
      await queryClient.invalidateQueries({ queryKey: ["vendor-earnings", userId] });
      setAccountNumber("");
      setEditingAccount(false);
      Toast.show({ type: "success", text1: "Payout account connected", text2: "Flutterwave will route future sales to this account." });
    },
    onError: (error: any) => {
      Toast.show({
        type: "error",
        text1: "Could not connect account",
        text2: error?.response?.data?.error || "Check the bank details and try again.",
      });
    },
  });

  const payoutAccount = accountQuery.data;
  const payouts = earningsQuery.data?.payouts ?? [];
  const canSave = /^[A-Z]{2}$/.test(country) && !!bankCode && /^\d{5,34}$/.test(accountNumber.replace(/\s/g, "")) && !!businessMobile.trim();

  return (
    <SafeScreen>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        <View className="px-6 pb-5 pt-7">
          <Text className="text-text-primary text-3xl font-bold">Earnings</Text>
          <Text className="mt-1 text-text-secondary">Flutterwave sales and settlement destination</Text>
        </View>

        <View className="mx-6 mb-5 rounded-2xl bg-primary p-5">
          <Text className="text-sm font-semibold text-white/80">Sales routed to your account</Text>
          {earningsQuery.isLoading ? (
            <ActivityIndicator className="mt-4 self-start" color="#FFFFFF" />
          ) : (
            <Text className="mt-2 text-3xl font-bold text-white">
              {formatAmount(earningsQuery.data?.totalRouted ?? 0)}
            </Text>
          )}
          <Text className="mt-2 text-xs leading-5 text-white/75">
            From verified buyer payments, before Flutterwave settlement fees. Bank credit follows Flutterwave&apos;s settlement schedule.
          </Text>
        </View>

        <View className="mx-6 mb-6 border-t border-surface-light pt-5">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-text-primary">Payout account</Text>
            {!!payoutAccount && !editingAccount && (
              <TouchableOpacity onPress={() => setEditingAccount(true)} accessibilityRole="button">
                <Text className="font-semibold text-primary">Change</Text>
              </TouchableOpacity>
            )}
          </View>

          {accountQuery.isLoading ? (
            <ActivityIndicator className="self-start" color="#4F2B50" />
          ) : payoutAccount && !editingAccount ? (
            <View className="flex-row items-center rounded-xl bg-surface p-4">
              <View className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-primary/15">
                <Ionicons name="business-outline" size={22} color="#4F2B50" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-text-primary">{payoutAccount.bankName}</Text>
                <Text className="mt-1 text-sm text-text-secondary">{payoutAccount.accountName} ···· {payoutAccount.accountLast4}</Text>
                <Text className="mt-1 text-xs text-text-tertiary">Connected with Flutterwave · {payoutAccount.country}</Text>
              </View>
              <Ionicons name="checkmark-circle" size={22} color="#1DB954" />
            </View>
          ) : (
            <View className="rounded-xl bg-surface p-4">
              <Text className="mb-4 text-sm leading-5 text-text-secondary">
                Add the bank account Flutterwave should use for your seller proceeds. Full account details are sent to Flutterwave and aren&apos;t stored by Reown.
              </Text>

              <Text className="mb-1 text-xs font-semibold uppercase text-text-secondary">Bank country code</Text>
              <TextInput
                value={country}
                onChangeText={(value) => {
                  setCountry(value.replace(/[^a-z]/gi, "").slice(0, 2).toUpperCase());
                  setBankCode("");
                }}
                placeholder="For example, NG"
                placeholderTextColor="#8E8491"
                autoCapitalize="characters"
                maxLength={2}
                className="mb-3 rounded-lg border border-surface-light bg-background px-3 py-3 text-text-primary"
                accessibilityLabel="Bank country code"
              />

              <Text className="mb-1 text-xs font-semibold uppercase text-text-secondary">Bank</Text>
              <TouchableOpacity
                onPress={() => setBankPickerOpen(true)}
                disabled={!/^[A-Z]{2}$/.test(country) || banksQuery.isLoading}
                className="mb-3 min-h-12 flex-row items-center justify-between rounded-lg border border-surface-light bg-background px-3 py-3"
                accessibilityRole="button"
                accessibilityLabel="Choose bank"
              >
                <Text className={bankCode ? "text-text-primary" : "text-text-tertiary"}>
                  {banksQuery.isLoading ? "Loading banks..." : banksQuery.data?.find((bank) => bank.code === bankCode)?.name || "Choose a bank"}
                </Text>
                {banksQuery.isLoading ? <ActivityIndicator color="#4F2B50" /> : <Ionicons name="chevron-down" size={18} color="#796D7F" />}
              </TouchableOpacity>
              {banksQuery.isError && <Text className="mb-3 text-sm text-red-500">Could not load banks for this country.</Text>}

              <Text className="mb-1 text-xs font-semibold uppercase text-text-secondary">Account number</Text>
              <TextInput
                value={accountNumber}
                onChangeText={setAccountNumber}
                placeholder="Bank account number"
                placeholderTextColor="#8E8491"
                keyboardType="number-pad"
                autoComplete="off"
                className="mb-3 rounded-lg border border-surface-light bg-background px-3 py-3 text-text-primary"
                accessibilityLabel="Bank account number"
              />

              <Text className="mb-1 text-xs font-semibold uppercase text-text-secondary">Phone number</Text>
              <TextInput
                value={businessMobile}
                onChangeText={setBusinessMobile}
                placeholder="Including country code"
                placeholderTextColor="#8E8491"
                keyboardType="phone-pad"
                className="mb-4 rounded-lg border border-surface-light bg-background px-3 py-3 text-text-primary"
                accessibilityLabel="Business phone number"
              />

              <TouchableOpacity
                onPress={() => saveAccount.mutate()}
                disabled={!canSave || saveAccount.isPending}
                className={`min-h-12 flex-row items-center justify-center rounded-xl px-4 ${canSave && !saveAccount.isPending ? "bg-primary" : "bg-primary/40"}`}
                accessibilityRole="button"
              >
                {saveAccount.isPending ? <ActivityIndicator color="#FFFFFF" /> : <Text className="font-bold text-white">Connect with Flutterwave</Text>}
              </TouchableOpacity>
              {editingAccount && payoutAccount && (
                <TouchableOpacity onPress={() => setEditingAccount(false)} className="mt-3 items-center py-2">
                  <Text className="font-semibold text-text-secondary">Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <View className="mx-6 border-t border-surface-light pt-5">
          <Text className="mb-3 text-lg font-bold text-text-primary">Recent sales</Text>
          {earningsQuery.isLoading ? (
            <ActivityIndicator className="self-start" color="#4F2B50" />
          ) : earningsQuery.isError ? (
            <Text className="text-sm text-red-500">Could not load sales. Pull to refresh and try again.</Text>
          ) : payouts.length === 0 ? (
            <View className="items-center rounded-xl bg-surface px-5 py-8">
              <Ionicons name="receipt-outline" size={30} color="#796D7F" />
              <Text className="mt-3 font-semibold text-text-primary">No routed sales yet</Text>
              <Text className="mt-1 text-center text-sm text-text-secondary">Completed Flutterwave checkouts will appear here.</Text>
            </View>
          ) : payouts.map((payout) => (
            <View key={`${payout.orderId}-${payout.transactionId}`} className="mb-2 flex-row items-center rounded-xl bg-surface p-4">
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-primary/15">
                <Ionicons name="arrow-down-outline" size={20} color="#4F2B50" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-text-primary">Order #{payout.orderId.slice(-8).toUpperCase()}</Text>
                <Text className="mt-1 text-xs text-text-secondary">{new Date(payout.createdAt).toLocaleDateString()} · Routed by Flutterwave</Text>
              </View>
              <Text className="font-bold text-text-primary">{formatAmount(payout.amount)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={bankPickerOpen} transparent animationType="slide" onRequestClose={() => setBankPickerOpen(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="max-h-[75%] rounded-t-2xl bg-background px-5 pb-8 pt-5">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-text-primary">Choose your bank</Text>
              <TouchableOpacity onPress={() => setBankPickerOpen(false)} accessibilityLabel="Close bank list">
                <Ionicons name="close" size={24} color="#796D7F" />
              </TouchableOpacity>
            </View>
            {banksQuery.isLoading ? <ActivityIndicator color="#4F2B50" /> : (
              <ScrollView keyboardShouldPersistTaps="handled">
                {(banksQuery.data ?? []).map((bank) => (
                  <TouchableOpacity
                    key={bank.code}
                    onPress={() => {
                      setBankCode(bank.code);
                      setBankPickerOpen(false);
                    }}
                    className="border-b border-surface-light py-4"
                    accessibilityRole="button"
                  >
                    <Text className="text-text-primary">{bank.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeScreen>
  );
}
