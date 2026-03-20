import { lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

// Initialize LemonSqueezy SDK (call this in every API route)
export function configureLemonSqueezy() {
  lemonSqueezySetup({
    apiKey: process.env.LEMONSQUEEZY_API_KEY!,
    onError: (error) => console.error("LemonSqueezy Error:", error),
  });
}

// Variant IDs (LemonSqueezy Dashboard'dan alınacak)
// Her plan = 1 variant. Dashboard'da product oluşturunca variant ID kopyalanır.
export const VARIANTS = {
  PRO_MONTHLY: process.env.LEMONSQUEEZY_VARIANT_PRO_MONTHLY || "",
  PRO_YEARLY: process.env.LEMONSQUEEZY_VARIANT_PRO_YEARLY || "",
  LIFETIME: process.env.LEMONSQUEEZY_VARIANT_LIFETIME || "",
} as const;

export type PlanType = "pro-monthly" | "pro-yearly" | "lifetime";

export function getVariantId(planType: PlanType): string {
  switch (planType) {
    case "pro-monthly":
      return VARIANTS.PRO_MONTHLY;
    case "pro-yearly":
      return VARIANTS.PRO_YEARLY;
    case "lifetime":
      return VARIANTS.LIFETIME;
  }
}

// Plan label helper
export function getPlanLabel(planType: PlanType): string {
  switch (planType) {
    case "pro-monthly":
      return "Pro (Aylık)";
    case "pro-yearly":
      return "Pro (Yıllık)";
    case "lifetime":
      return "Lifetime";
  }
}
