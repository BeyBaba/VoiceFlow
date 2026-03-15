import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ===== METHOD 1: Email-based verification (DB lookup) =====
// Desktop app calls this with user's Google email to check plan
export async function POST(request: Request) {
  try {
    const { email, licenseKey } = (await request.json()) as {
      email?: string;
      licenseKey?: string;
    };

    // If license key provided, validate via LemonSqueezy License API
    if (licenseKey) {
      return await validateLicenseKey(licenseKey);
    }

    // Otherwise, validate via email
    if (!email) {
      return NextResponse.json(
        { error: "Email or license key is required" },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { email },
    });

    if (!customer) {
      return NextResponse.json({
        plan: "free",
        email,
        active: false,
        trialActive: false,
        trialDaysLeft: 0,
        trialEndDate: null,
      });
    }

    // Trial bilgisi hesapla
    const trialEndDate = customer.trialEndDate;
    const trialActive =
      customer.plan === "free" &&
      trialEndDate &&
      new Date(trialEndDate) > new Date();
    const trialDaysLeft =
      trialActive && trialEndDate
        ? Math.max(
            0,
            Math.ceil(
              (new Date(trialEndDate).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24)
            )
          )
        : 0;

    // Check if subscription is still valid
    const isActive =
      customer.plan === "lifetime" ||
      (customer.plan === "free" && trialActive) ||
      (customer.plan === "pro" &&
        customer.currentPeriodEnd &&
        new Date(customer.currentPeriodEnd) > new Date());

    return NextResponse.json({
      plan: isActive ? customer.plan : "free",
      email: customer.email,
      active: isActive || false,
      expiresAt: customer.currentPeriodEnd?.toISOString() || null,
      trialActive: trialActive || false,
      trialDaysLeft,
      trialEndDate: trialEndDate?.toISOString() || null,
    });
  } catch (error) {
    console.error("License verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify license" },
      { status: 500 }
    );
  }
}

// ===== METHOD 2: License key validation via LemonSqueezy API =====
// Desktop app can validate license key directly (no DB needed)
async function validateLicenseKey(licenseKey: string) {
  try {
    const response = await fetch(
      "https://api.lemonsqueezy.com/v1/licenses/validate",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          license_key: licenseKey,
        }),
      }
    );

    const data = await response.json();

    if (data.valid) {
      // Determine plan based on variant
      const plan =
        data.license_key?.status === "active" ? "pro" : "free";

      return NextResponse.json({
        plan: data.meta?.variant_name?.toLowerCase().includes("lifetime")
          ? "lifetime"
          : plan,
        active: data.valid,
        email: data.meta?.customer_email || null,
        licenseKey: data.license_key?.key || licenseKey,
        expiresAt: data.license_key?.expires_at || null,
      });
    }

    return NextResponse.json({
      plan: "free",
      active: false,
      error: data.error || "Invalid license key",
    });
  } catch (error) {
    console.error("License key validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate license key" },
      { status: 500 }
    );
  }
}

// GET endpoint for simple checks
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({
    where: { email },
  });

  if (!customer) {
    return NextResponse.json({
      plan: "free",
      active: false,
      trialActive: false,
      trialDaysLeft: 0,
    });
  }

  const trialActive =
    customer.plan === "free" &&
    customer.trialEndDate &&
    new Date(customer.trialEndDate) > new Date();
  const trialDaysLeft =
    trialActive && customer.trialEndDate
      ? Math.max(
          0,
          Math.ceil(
            (new Date(customer.trialEndDate).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : 0;

  const isActive =
    customer.plan === "lifetime" ||
    (customer.plan === "free" && trialActive) ||
    (customer.plan === "pro" &&
      customer.currentPeriodEnd &&
      new Date(customer.currentPeriodEnd) > new Date());

  return NextResponse.json({
    plan: isActive ? customer.plan : "free",
    active: isActive || false,
    trialActive: trialActive || false,
    trialDaysLeft,
  });
}
