export function buildFlutterwaveSubaccounts(vendors, checkoutTotal) {
  const entries = vendors.map((vendor) => ({
    id: vendor.subaccountId,
    salesCents: Math.round(Number(vendor.salesAmount) * 100),
  }));
  const salesCents = entries.reduce((total, vendor) => total + vendor.salesCents, 0);
  const checkoutCents = Math.round(Number(checkoutTotal) * 100);

  if (!entries.length || entries.some((vendor) => !vendor.id || vendor.salesCents <= 0)) {
    throw new Error("Every vendor split requires a subaccount and positive sales amount");
  }
  if (salesCents > checkoutCents) {
    throw new Error("Vendor sales cannot exceed the checkout total");
  }

  const platformCents = checkoutCents - salesCents;
  let allocatedPlatformCents = 0;

  return entries.map((vendor, index) => {
    const platformShareCents = index === entries.length - 1
      ? platformCents - allocatedPlatformCents
      : Math.floor(platformCents * vendor.salesCents / salesCents);
    allocatedPlatformCents += platformShareCents;

    return {
      id: vendor.id,
      transaction_split_ratio: vendor.salesCents,
      transaction_charge_type: "flat",
      transaction_charge: platformShareCents / 100,
    };
  });
}
