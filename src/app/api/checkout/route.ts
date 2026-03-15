import { NextResponse } from "next/server";
import { createCheckout } from "@lemonsqueezy/lemonsqueezy.js";
import { configureLemonSqueezy, getVariantId } from "@/lib/lemonsqueezy";
import type { PlanType } from "@/lib/lemonsqueezy";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    // Auth zorunlu
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Giriş yapmanız gerekiyor" },
        { status: 401 }
      );
    }

    configureLemonSqueezy();

    const { planType } = (await request.json()) as { planType: PlanType };

    if (!planType || !["pro-monthly", "pro-yearly", "lifetime"].includes(planType)) {
      return NextResponse.json(
        { error: "Invalid plan type" },
        { status: 400 }
      );
    }

    const variantId = getVariantId(planType);
    const storeId = process.env.LEMONSQUEEZY_STORE_ID!;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";

    // Create LemonSqueezy Checkout
    const { data, error } = await createCheckout(storeId, variantId, {
      checkoutOptions: {
        embed: false,
        media: true,
        logo: true,
      },
      checkoutData: {
        email: session.user.email,
        custom: {
          plan_type: planType,
        },
      },
      productOptions: {
        redirectUrl: `${baseUrl}/success`,
        receiptButtonText: "VoiceFlow'a Dön",
        receiptThankYouNote:
          "VoiceFlow satın aldığınız için teşekkürler! Lisans anahtarınız e-posta ile gönderilecek.",
      },
    });

    if (error) {
      console.error("LemonSqueezy checkout error:", error);
      return NextResponse.json(
        { error: "Failed to create checkout" },
        { status: 500 }
      );
    }

    const checkoutUrl = data?.data.attributes.url;

    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
