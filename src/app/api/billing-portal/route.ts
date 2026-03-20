import { NextResponse } from "next/server";
import { getSubscription } from "@lemonsqueezy/lemonsqueezy.js";
import { configureLemonSqueezy } from "@/lib/lemonsqueezy";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email } = (await request.json()) as { email: string };

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Find customer in our DB
    const customer = await prisma.customer.findUnique({
      where: { email },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // If we have a cached portal URL, return it
    if (customer.customerPortalUrl) {
      return NextResponse.json({ url: customer.customerPortalUrl });
    }

    // If we have a subscription ID, fetch fresh portal URL from LemonSqueezy
    if (customer.lemonSqueezySubscriptionId) {
      configureLemonSqueezy();

      const { data, error } = await getSubscription(
        customer.lemonSqueezySubscriptionId
      );

      if (!error && data) {
        const portalUrl = data.data.attributes.urls.customer_portal;

        // Cache the portal URL
        await prisma.customer.update({
          where: { email },
          data: { customerPortalUrl: portalUrl },
        });

        return NextResponse.json({ url: portalUrl });
      }
    }

    return NextResponse.json(
      { error: "No active subscription found" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Billing portal error:", error);
    return NextResponse.json(
      { error: "Failed to get billing portal" },
      { status: 500 }
    );
  }
}
