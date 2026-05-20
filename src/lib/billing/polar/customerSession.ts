import { siteConfig } from "@/lib/site";
import { polarFetch } from "@/lib/billing/polar/client";

type PolarCustomerSessionResponse = {
  id: string;
  customer_portal_url: string;
  token?: string;
};

export async function createPolarCustomerPortalSession(
  userId: string,
): Promise<{ url: string }> {
  const baseUrl = siteConfig.url.replace(/\/$/, "");
  const returnUrl = `${baseUrl}/account`;

  const session = await polarFetch<PolarCustomerSessionResponse>("/v1/customer-sessions/", {
    method: "POST",
    json: {
      external_customer_id: userId,
      return_url: returnUrl,
    },
  });

  if (!session.customer_portal_url) {
    throw new Error("Polar did not return a customer portal URL.");
  }

  return { url: session.customer_portal_url };
}
