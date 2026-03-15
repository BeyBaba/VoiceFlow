import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  // 1. Read raw body for signature verification
  const rawBody = await request.text();
  const signature = request.headers.get("X-Signature");
  const eventName = request.headers.get("X-Event-Name");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  // 2. Verify HMAC-SHA256 signature
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!;
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(rawBody).digest("hex");

  try {
    if (
      !crypto.timingSafeEqual(
        Buffer.from(digest, "utf8"),
        Buffer.from(signature, "utf8")
      )
    ) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // 3. Parse verified payload
  const payload = JSON.parse(rawBody);
  const attributes = payload.data?.attributes;
  const customData = payload.meta?.custom_data;

  try {
    switch (eventName) {
      // ===== ORDER CREATED (Lifetime tek seferlik ödeme) =====
      case "order_created": {
        const email = attributes.user_email;
        const planType = customData?.plan_type || "lifetime";

        if (email && planType === "lifetime") {
          await prisma.customer.upsert({
            where: { email },
            update: {
              plan: "lifetime",
              lemonSqueezyCustomerId: String(attributes.customer_id),
              lemonSqueezyOrderId: String(payload.data.id),
              currentPeriodEnd: null, // Lifetime = no expiry
            },
            create: {
              email,
              plan: "lifetime",
              lemonSqueezyCustomerId: String(attributes.customer_id),
              lemonSqueezyOrderId: String(payload.data.id),
              currentPeriodEnd: null,
            },
          });
          console.log(`✅ Lifetime plan activated for ${email}`);
        }
        break;
      }

      // ===== SUBSCRIPTION CREATED =====
      case "subscription_created": {
        const email = attributes.user_email;
        const planType = customData?.plan_type || "pro-monthly";

        if (email) {
          await prisma.customer.upsert({
            where: { email },
            update: {
              plan: "pro",
              lemonSqueezyCustomerId: String(attributes.customer_id),
              lemonSqueezySubscriptionId: String(payload.data.id),
              lemonSqueezyVariantId: String(attributes.variant_id),
              customerPortalUrl: attributes.urls?.customer_portal || null,
              currentPeriodEnd: attributes.renews_at
                ? new Date(attributes.renews_at)
                : null,
            },
            create: {
              email,
              plan: "pro",
              lemonSqueezyCustomerId: String(attributes.customer_id),
              lemonSqueezySubscriptionId: String(payload.data.id),
              lemonSqueezyVariantId: String(attributes.variant_id),
              customerPortalUrl: attributes.urls?.customer_portal || null,
              currentPeriodEnd: attributes.renews_at
                ? new Date(attributes.renews_at)
                : null,
            },
          });
          console.log(`✅ Pro subscription created for ${email} (${planType})`);
        }
        break;
      }

      // ===== SUBSCRIPTION UPDATED =====
      case "subscription_updated": {
        const email = attributes.user_email;
        const status = attributes.status; // active, paused, past_due, cancelled, expired

        if (email) {
          const plan =
            status === "active" || status === "on_trial" ? "pro" : "free";

          await prisma.customer.updateMany({
            where: { email },
            data: {
              plan,
              lemonSqueezyVariantId: String(attributes.variant_id),
              customerPortalUrl: attributes.urls?.customer_portal || null,
              currentPeriodEnd: attributes.renews_at
                ? new Date(attributes.renews_at)
                : null,
            },
          });
          console.log(`🔄 Subscription updated for ${email}: ${status}`);
        }
        break;
      }

      // ===== SUBSCRIPTION CANCELLED =====
      case "subscription_cancelled": {
        const email = attributes.user_email;

        if (email) {
          // Don't downgrade immediately — subscription is still active until ends_at
          const endsAt = attributes.ends_at
            ? new Date(attributes.ends_at)
            : null;

          await prisma.customer.updateMany({
            where: { email },
            data: {
              currentPeriodEnd: endsAt, // Access until this date
            },
          });
          console.log(
            `⚠️ Subscription cancelled for ${email}, active until ${endsAt}`
          );
        }
        break;
      }

      // ===== SUBSCRIPTION EXPIRED =====
      case "subscription_expired": {
        const email = attributes.user_email;

        if (email) {
          // Check if they have lifetime — don't downgrade
          const existing = await prisma.customer.findFirst({
            where: { email },
          });

          if (existing && existing.plan !== "lifetime") {
            await prisma.customer.updateMany({
              where: { email },
              data: {
                plan: "free",
                lemonSqueezySubscriptionId: null,
                currentPeriodEnd: null,
              },
            });
            console.log(`❌ Subscription expired for ${email}`);
          }
        }
        break;
      }

      // ===== PAYMENT FAILED =====
      case "subscription_payment_failed": {
        const email = attributes.user_email || "unknown";
        console.error(`⚠️ Payment failed for ${email}`);
        break;
      }

      // ===== LICENSE KEY CREATED =====
      case "license_key_created": {
        const licenseKey = payload.data.attributes.key;
        const email = payload.data.attributes.user_email;
        console.log(`🔑 License key created for ${email}: ${licenseKey}`);
        // License key is automatically sent via email by LemonSqueezy
        break;
      }

      default:
        console.log(`ℹ️ Unhandled webhook event: ${eventName}`);
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
