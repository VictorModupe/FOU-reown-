import { ENV } from "../config/env.js";
import { Order } from "../models/order.model.js";
import { User } from "../models/user.model.js";

const flutterwaveRequest = async (path, options = {}) => {
  const response = await fetch(`https://api.flutterwave.com/v3${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${ENV.FLUTTERWAVE_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const result = await response.json();
  return { response, result };
};

const vendorOnly = (req, res) => {
  if (!req.user || req.user.role !== "vendor") {
    res.status(403).json({ error: "Vendor access only" });
    return false;
  }
  return true;
};

const publicPayoutAccount = (account) => account ? {
  country: account.country,
  bankName: account.bankName,
  accountName: account.accountName,
  accountLast4: account.accountLast4,
  connectedAt: account.connectedAt,
} : null;

export async function getVendorPayoutAccount(req, res) {
  if (!vendorOnly(req, res)) return;
  return res.status(200).json({ payoutAccount: publicPayoutAccount(req.user.flutterwavePayout) });
}

export async function getVendorBanks(req, res) {
  if (!vendorOnly(req, res)) return;
  if (!ENV.FLUTTERWAVE_SECRET_KEY) {
    return res.status(503).json({ error: "Flutterwave is not configured" });
  }

  const country = String(req.params.country || "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(country)) return res.status(400).json({ error: "Enter a valid two-letter country code" });

  try {
    const { response, result } = await flutterwaveRequest(`/banks/${encodeURIComponent(country)}`);
    if (!response.ok || result.status !== "success" || !Array.isArray(result.data)) {
      return res.status(502).json({ error: "Could not load banks from Flutterwave" });
    }
    return res.status(200).json({ banks: result.data.map((bank) => ({
      code: String(bank.code || bank.id || ""),
      name: String(bank.name || ""),
    })).filter((bank) => bank.code && bank.name) });
  } catch (error) {
    console.error("Error loading Flutterwave banks:", error.message);
    return res.status(502).json({ error: "Could not load banks from Flutterwave" });
  }
}

export async function connectVendorPayoutAccount(req, res) {
  if (!vendorOnly(req, res)) return;
  if (!ENV.FLUTTERWAVE_SECRET_KEY) {
    return res.status(503).json({ error: "Flutterwave is not configured" });
  }

  const country = String(req.body?.country || "").trim().toUpperCase();
  const bankCode = String(req.body?.bankCode || "").trim();
  const accountNumber = String(req.body?.accountNumber || "").replace(/\s/g, "");
  const businessMobile = String(req.body?.businessMobile || "").trim();
  if (!/^[A-Z]{2}$/.test(country) || !bankCode || !/^\d{5,34}$/.test(accountNumber) || !businessMobile) {
    return res.status(400).json({ error: "Enter a valid country, bank, account number, and phone number" });
  }

  try {
    const { response, result } = await flutterwaveRequest("/subaccounts", {
      method: "POST",
      body: JSON.stringify({
        account_bank: bankCode,
        account_number: accountNumber,
        business_name: req.user.name,
        business_email: req.user.email,
        business_mobile: businessMobile,
        country,
        split_type: "percentage",
        split_value: 1,
      }),
    });
    const subaccount = result.data;
    if (!response.ok || result.status !== "success" || !subaccount?.subaccount_id) {
      console.warn("Flutterwave subaccount registration failed", { status: response.status });
      return res.status(422).json({ error: "Flutterwave could not verify this bank account" });
    }

    const payoutAccount = {
      subaccountId: subaccount.subaccount_id,
      country,
      bankCode,
      bankName: String(subaccount.bank_name || "Bank account"),
      accountName: String(subaccount.full_name || req.user.name),
      accountLast4: accountNumber.slice(-4),
      businessMobile,
      connectedAt: new Date(),
    };
    await User.updateOne({ _id: req.user._id }, { $set: { flutterwavePayout: payoutAccount } });
    return res.status(200).json({ payoutAccount: publicPayoutAccount(payoutAccount) });
  } catch (error) {
    console.error("Error connecting Flutterwave payout account:", error.message);
    return res.status(502).json({ error: "Could not connect this bank account with Flutterwave" });
  }
}

export async function getVendorEarnings(req, res) {
  if (!vendorOnly(req, res)) return;

  try {
    const orders = await Order.find({
      "vendorPayouts.vendor": req.user._id,
      "paymentResult.status": "succeeded",
    })
      .select("vendorPayouts paymentResult createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const payouts = orders.flatMap((order) => order.vendorPayouts
      .filter((payout) => payout.vendor.toString() === req.user._id.toString())
      .map((payout) => ({
        orderId: order._id,
        transactionId: order.paymentResult.id,
        amount: payout.amount,
        status: "routed",
        createdAt: order.createdAt,
      })));
    const totalRouted = payouts.reduce((total, payout) => total + payout.amount, 0);

    return res.status(200).json({ totalRouted, payouts });
  } catch (error) {
    console.error("Error fetching vendor earnings:", error.message);
    return res.status(500).json({ error: "Could not load vendor earnings" });
  }
}
