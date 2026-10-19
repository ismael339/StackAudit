import type { AppRecord, Recommendation } from "@/lib/types";

// ─── Category detection ────────────────────────────────────────────────

interface CategoryRule {
  category: string;
  keywords: string[];
}

const CATEGORY_RULES: CategoryRule[] = [
  { category: "Reviews", keywords: ["review", "judge", "rating", "testimonial", "yotpo", "loox", "okendo", "stamped"] },
  { category: "Email Marketing", keywords: ["email", "mailchimp", "klaviyo", "omnisend", "newsletter", "campaign"] },
  { category: "SEO", keywords: ["seo", "meta", "schema", "optimizer", "rank", "search"] },
  { category: "Upsell & Cross-sell", keywords: ["upsell", "cross-sell", "cross sell", "bundle", "frequently bought", "reconvert", "cart hook"] },
  { category: "Page Builder", keywords: ["page", "landing", "shogun", "pagefly", "gempages", "vitals", "section"] },
  { category: "Shipping & Delivery", keywords: ["shipping", "delivery", "carrier", "parcel"] },
  { category: "Trust & Security", keywords: ["trust", "security", "badge", "gdpr", "cookie", "consent"] },
  { category: "Loyalty & Rewards", keywords: ["loyalty", "reward", "point", "referral", "smile", "loyaltylion"] },
  { category: "Popups & Bars", keywords: ["popup", "bar", "announcement", "optin", "privy", "justuno"] },
  { category: "Inventory Management", keywords: ["inventory", "stock", "back in low", "preorder"] },
  { category: "Analytics", keywords: ["analytics", "report", "insight", "lifetimely", "trueprofit"] },
  { category: "Customer Support", keywords: ["support", "helpdesk", "chat", "gorgias", "tidio", "zendesk", "crisp"] },
  { category: "Print on Demand", keywords: ["printful", "printify", "print on demand", "pod"] },
  { category: "Currency Conversion", keywords: ["currency", "geolocation", "conversion", "langify", "weglot"] },
];

export function detectCategory(title: string, handle: string): string {
  const haystack = `${title} ${handle}`.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((kw) => haystack.includes(kw.toLowerCase()))) {
      return rule.category;
    }
  }
  return "Other";
}

// ─── Redundancy detection ──────────────────────────────────────────────

/**
 * Two apps are considered redundant when they share the same
 * non-generic category. Returns a Set of app ids flagged redundant.
 */
export function detectRedundantApps(
  apps: Array<Pick<AppRecord, "id" | "category">>
): Set<string> {
  const byCategory = new Map<string, string[]>();
  for (const app of apps) {
    if (!app.category || app.category === "Other") continue;
    const list = byCategory.get(app.category) ?? [];
    list.push(app.id);
    byCategory.set(app.category, list);
  }

  const redundant = new Set<string>();
  for (const ids of byCategory.values()) {
    if (ids.length > 1) {
      for (const id of ids) redundant.add(id);
    }
  }
  return redundant;
}

// ─── Cheaper alternatives (curated, common categories) ────────────────

interface Alternative {
  name: string;
  estimatedPrice: number;
}

const ALTERNATIVES: Record<string, Alternative> = {
  "Reviews": { name: "Judge.me (free plan) or Loox", estimatedPrice: 0 },
  "Email Marketing": { name: "Shopify Email or Omnisend free tier", estimatedPrice: 0 },
  "Popups & Bars": { name: "Poopup or Shopify Email forms", estimatedPrice: 0 },
  "Upsell & Cross-sell": { name: "ReConvert (starter plan)", estimatedPrice: 5 },
  "Page Builder": { name: "Shogun (starter) or Shopify sections", estimatedPrice: 9 },
  "Loyalty & Rewards": { name: "Smile.io (free plan)", estimatedPrice: 0 },
  "Currency Conversion": { name: "Shopify Markets (built-in)", estimatedPrice: 0 },
  "Trust & Security": { name: "Free GDPR/cookie apps", estimatedPrice: 0 },
  "Analytics": { name: "Shopify Analytics (built-in) or Lifetimely lite", estimatedPrice: 0 },
};

// ─── Savings estimation ────────────────────────────────────────────────

const EXPENSIVE_THRESHOLD = 30; // USD / month

export interface AuditResult {
  totalMonthlyCost: number;
  potentialSavings: number;
  recommendations: Recommendation[];
  redundantIds: Set<string>;
}

export function analyzeApps(apps: AppRecord[]): AuditResult {
  const redundantIds = detectRedundantApps(apps);
  const recommendations: Recommendation[] = [];
  let potentialSavings = 0;

  // Sort by cost desc so the most expensive "keep" spot per category
  const sorted = [...apps].sort((a, b) => (b.monthly_cost ?? 0) - (a.monthly_cost ?? 0));

  const keptPerCategory = new Set<string>();

  for (const app of sorted) {
    const cost = app.monthly_cost ?? 0;

    // Redundancy: keep the first (most expensive) in each category, flag the rest
    if (redundantIds.has(app.id)) {
      const category = app.category ?? "Other";
      if (!keptPerCategory.has(category)) {
        keptPerCategory.add(category);
        // The kept app itself may still be "expensive" — handled below.
      } else {
        const alt = ALTERNATIVES[category];
        const savings = alt ? Math.max(cost - alt.estimatedPrice, 0) : cost;
        potentialSavings += savings;
        recommendations.push({
          type: "redundant",
          app_id: app.id,
          app_title: app.title,
          message: `Duplicate in "${category}". You already have another ${category.toLowerCase()} app — remove this one to save $${cost}/mo.`,
          estimated_monthly_savings: savings,
          alternative: alt?.name,
        });
        continue;
      }
    }

    // Expensive app check
    if (cost >= EXPENSIVE_THRESHOLD) {
      const alt = ALTERNATIVES[app.category ?? "Other"];
      const savings = alt ? Math.max(cost - alt.estimatedPrice, 0) : Math.round(cost * 0.4);
      recommendations.push({
        type: "expensive",
        app_id: app.id,
        app_title: app.title,
        message: `This app costs $${cost}/mo. ${
          alt
            ? `Consider ${alt.name} (≈$${alt.estimatedPrice}/mo).`
            : "Review whether you still need all its features."
        }`,
        estimated_monthly_savings: savings,
        alternative: alt?.name,
      });
    }
  }

  const totalMonthlyCost = apps.reduce((sum, a) => sum + (a.monthly_cost ?? 0), 0);

  return {
    totalMonthlyCost,
    potentialSavings,
    recommendations,
    redundantIds,
  };
}

