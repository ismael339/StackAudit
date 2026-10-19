import { createHmac, timingSafeEqual } from "crypto";
import type { ShopifyApp } from "@/lib/types";

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY ?? "";
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET ?? "";
const SHOPIFY_SCOPES = process.env.SHOPIFY_SCOPES ?? "read_apps";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const API_VERSION = "2025-01";

/** Build the OAuth authorize URL for a given shop domain. */
export function buildShopifyAuthUrl(shop: string): string {
  const redirectUri = `${APP_URL}/api/shopify/callback`;
  const params = new URLSearchParams({
    client_id: SHOPIFY_API_KEY,
    scope: SHOPIFY_SCOPES,
    redirect_uri: redirectUri,
  });
  return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
}

/**
 * Verify the HMAC signature Shopify appends to OAuth callback queries.
 * Uses timing-safe comparison.
 */
export function verifyShopifyHmac(query: Record<string, string>): boolean {
  const hmac = query["hmac"];
  if (!hmac || !SHOPIFY_API_SECRET) return false;

  const params = { ...query };
  delete params["hmac"];
  delete params["signature"];

  const message = Object.keys(params)
    .sort()
    .map((key) => `${key}=${Array.isArray(params[key]) ? params[key] : params[key]}`)
    .join("&");

  const generated = createHmac("sha256", SHOPIFY_API_SECRET)
    .update(message)
    .digest("hex");

  try {
    const a = Buffer.from(generated, "hex");
    const b = Buffer.from(hmac, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Exchange the temporary OAuth code for a permanent access token. */
export async function exchangeShopifyToken(
  shop: string,
  code: string
): Promise<{ accessToken: string; scope: string }> {
  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: SHOPIFY_API_KEY,
      client_secret: SHOPIFY_API_SECRET,
      code,
    }),
  });

  if (!response.ok) {
    throw new Error(`Shopify token exchange failed (${response.status})`);
  }

  const data = (await response.json()) as { access_token: string; scope: string };
  return { accessToken: data.access_token, scope: data.scope };
}

interface ShopifyAppsResponse {
  apps: Array<{
    id: number;
    title: string;
    handle: string;
    installed_at: string;
  }>;
}

/**
 * Fetch installed applications via the Admin GraphQL API.
 * Falls back to a REST-shaped response if GraphQL is unavailable.
 */
export async function fetchInstalledApps(
  shop: string,
  accessToken: string
): Promise<ShopifyApp[]> {
  const query = `query { currentInstallation { app { id title handle } installedAt } }`;

  const response = await fetch(
    `https://${shop}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({ query }),
      cache: "no-store",
    }
  );

  if (response.ok) {
    const json = (await response.json()) as {
      data?: {
        currentInstallation?: {
          app: { id: string; title: string; handle: string };
          installedAt: string;
        } | null;
      };
      errors?: Array<{ message: string }>;
    };

    if (json.data?.currentInstallation) {
      const inst = json.data.currentInstallation;
      return [
        {
          id: Number(inst.app.id),
          title: inst.app.title,
          handle: inst.app.handle,
          installed_at: inst.installedAt,
        },
      ];
    }
  }

  // Fallback: fetch via REST application proxy endpoint
  return fetchInstalledAppsRest(shop, accessToken);
}

/**
 * REST fallback. Note: the public Admin REST API does not expose the full
 * list of installed apps to all plan types; this helper handles the
 * `application_proxy` style listing when available and otherwise
 * returns an empty array (the UI shows an informative empty state).
 */
async function fetchInstalledAppsRest(
  shop: string,
  accessToken: string
): Promise<ShopifyApp[]> {
  try {
    const response = await fetch(
      `https://${shop}/admin/api/${API_VERSION}/applications.json`,
      {
        headers: { "X-Shopify-Access-Token": accessToken },
        cache: "no-store",
      }
    );
    if (!response.ok) return [];
    const json = (await response.json()) as { applications?: ShopifyAppsResponse["apps"] };
    return (json.applications ?? []).map((app) => ({
      id: app.id,
      title: app.title,
      handle: app.handle,
      installed_at: app.installed_at,
    }));
  } catch {
    return [];
  }
}

/** Fetch basic shop info (name, domain) for display. */
export async function fetchShopDetails(
  shop: string,
  accessToken: string
): Promise<{ name: string; domain: string } | null> {
  try {
    const response = await fetch(`https://${shop}/admin/api/${API_VERSION}/shop.json`, {
      headers: { "X-Shopify-Access-Token": accessToken },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const json = (await response.json()) as { shop: { name: string; domain: string } };
    return { name: json.shop.name, domain: json.shop.domain };
  } catch {
    return null;
  }
}
