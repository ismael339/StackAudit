// ─── Domain types shared across the app ────────────────────────────────

export type Plan = "free" | "pro";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  plan: Plan;
  stripe_customer_id: string | null;
  created_at: string;
}

export interface Store {
  id: string;
  user_id: string;
  shopify_domain: string;
  shop_name: string | null;
  /** Encrypted at rest via pgcrypto; never sent to the client */
  access_token: string | null;
  plan_limit_reached: boolean;
  last_synced_at: string | null;
  created_at: string;
}

/** Store shape safe to send to the browser (no token) */
export type StorePublic = Omit<Store, "access_token">;

export interface ShopifyApp {
  id: number;
  title: string;
  handle: string;
  installed_at: string;
}

export interface AppRecord {
  id: string;
  store_id: string;
  shopify_app_id: string;
  title: string;
  handle: string;
  installed_at: string | null;
  category: string | null;
  monthly_cost: number | null;
  is_redundant: boolean;
  notes: string | null;
  created_at: string;
}

export interface Recommendation {
  type: "expensive" | "redundant" | "unused" | "downgrade";
  app_id: string;
  app_title: string;
  message: string;
  estimated_monthly_savings: number;
  alternative?: string;
}

export interface Audit {
  id: string;
  store_id: string;
  total_monthly_cost: number;
  potential_savings: number;
  recommendations: Recommendation[];
  created_at: string;
}

// ─── Plan limits ───────────────────────────────────────────────────────

export const FREE_PLAN_LIMITS = {
  max_stores: 1,
  max_audits_per_month: 3,
} as const;

// ─── API response envelopes ────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
