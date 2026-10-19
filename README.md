# StackAudit

**Audit your Shopify app stack. Cut waste. Save money.**

StackAudit is a micro-SaaS that connects to a Shopify store via OAuth, lists all installed apps, lets merchants estimate monthly costs, detects expensive and redundant apps, and delivers clear savings recommendations.

- **Free plan**: 1 store, 3 audits/month
- **Pro plan**: $29/month or $290/year — unlimited stores, unlimited audits, history, export

## Tech stack

| Layer | Tech |
| --- | --- |
| Framework | Next.js 15 (App Router) + TypeScript (strict) |
| Styling | Tailwind CSS + shadcn/ui-style components |
| Database & Auth | Supabase (PostgreSQL + Auth + RLS) |
| Payments | Stripe (Checkout + Customer Portal + Webhooks) |
| Shopify | Admin API OAuth 2.0 (scope: `read_apps`) |
| Deployment | Vercel (hobby plan compatible) |
| Package manager | pnpm |

## Project structure

```
/
├── app/
│   ├── (marketing)/           # Landing + pricing (public)
│   ├── (auth)/                # Login / signup
│   ├── (dashboard)/           # Protected app: dashboard, audit, recommendations, settings, billing
│   ├── api/
│   │   ├── auth/callback/     # Supabase OAuth/confirm callback
│   │   ├── shopify/           # Shopify OAuth start + callback
│   │   ├── stripe/            # Checkout, portal, webhook
│   │   └── audit/             # Run audit (sync apps + analyze)
│   ├── error.tsx              # Global error boundary
│   ├── not-found.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                    # Button, card, table, dialog, select…
│   ├── shared/                # Header, footer, logo, auth form
│   ├── dashboard/             # Nav, connect dialog, settings/billing actions
│   └── audit/                 # Workbench + editable apps table
├── lib/
│   ├── supabase/              # Browser/server/admin clients + middleware
│   ├── audit.ts               # Category detection, redundancy, savings engine
│   ├── shopify.ts             # OAuth URL, HMAC verify, token exchange, API calls
│   ├── stripe.ts              # Stripe singleton + plan config
│   ├── token-crypto.ts        # Access-token encryption at rest
│   ├── types.ts               # Shared domain types
│   └── utils.ts
├── supabase/migrations/       # SQL schema + RLS
├── middleware.ts              # Session refresh + route protection
├── tailwind.config.ts
└── .env.example
```

## 1. Local development

```bash
# Install dependencies (Node 20+ required)
pnpm install

# Copy env file and fill values (see sections below)
cp .env.example .env.local

# Start dev server
pnpm dev
```

Open http://localhost:3000.

Scripts:

| Command | Description |
| --- | --- |
| `pnpm dev` | Dev server |
| `pnpm build` | Production build |
| `pnpm start` | Serve production build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript type check (no emit) |

## 2. Supabase setup

1. Create a project at https://supabase.com.
2. In **Project Settings → API**, copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server-only, never expose)
3. Apply the schema: open **SQL Editor** and run the contents of
   `supabase/migrations/0001_initial_schema.sql` (or `supabase db push` with the CLI).
   This creates `profiles`, `stores`, `apps`, `audits`, the signup trigger, and all
   Row Level Security policies.
4. Enable auth providers (**Authentication → Providers**):
   - **Email**: enabled by default. For quick local testing you can disable
     "Confirm email" so signups log in immediately.
   - **Google**: create OAuth credentials in Google Cloud Console, then paste the
     client ID/secret into Supabase. Add the redirect URL shown by Supabase.
5. In **Authentication → URL Configuration**, set Site URL to your app URL and add
   `http://localhost:3000/api/auth/callback` to Redirect URLs (plus the production
   equivalent).

## 3. Shopify Partner app setup

1. Create a free account at https://partners.shopify.com.
2. **Apps → Create app → Custom app**.
3. In **App setup**:
   - **App URL**: `https://<your-domain>`
   - **Allowed redirection URL(s)**: `https://<your-domain>/api/shopify/callback`
     (locally use a tunnel such as ngrok or Cloudflare Tunnel, or the Vercel preview URL).
4. Under **Configuration → Scopes**, add `read_apps` (least privilege — we only list
   installed apps). Copy the scope string into `SHOPIFY_SCOPES`.
5. From **Client credentials**, copy:
   - API key → `SHOPIFY_API_KEY`
   - API secret key → `SHOPIFY_API_SECRET`
6. Install the app on your development store from the Partner dashboard to test:
   dashboard → *Connect new store* → enter `your-store.myshopify.com` → approve.

> Note: the Shopify public REST API does not expose the full installed-apps list to
> every plan. StackAudit tries the GraphQL Admin API first and gracefully falls back.
> If your plan cannot enumerate apps, the audit page lets you continue with the apps
> it can see and you can re-run audits anytime.

## 4. Stripe setup

1. Create an account at https://stripe.com (test mode).
2. **Developers → API keys**: copy the secret key → `STRIPE_SECRET_KEY` and
   publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
3. Create a product **StackAudit Pro** with two recurring prices:
   - Monthly $29 → `STRIPE_PRICE_ID_MONTHLY`
   - Yearly $290 → `STRIPE_PRICE_ID_YEARLY`
4. **Developers → Webhooks → Add endpoint**:
   - URL: `https://<your-domain>/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.created`,
     `customer.subscription.updated`, `customer.subscription.deleted`
5. Copy the signing secret → `STRIPE_WEBHOOK_SECRET`.
6. Optional: configure the **Customer Portal** (Settings → Billing → Customer
   portal) so users can cancel from `/billing`.

Local webhook testing:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## 5. Environment variables

See `.env.example`:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin key (webhooks/OAuth callbacks) |
| `SHOPIFY_API_KEY` | Shopify app API key |
| `SHOPIFY_API_SECRET` | Shopify app API secret (HMAC verification) |
| `SHOPIFY_SCOPES` | OAuth scopes, default `read_apps` |
| `NEXT_PUBLIC_APP_URL` | Base URL, no trailing slash |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_PRICE_ID_MONTHLY` | Price ID for $29/mo |
| `STRIPE_PRICE_ID_YEARLY` | Price ID for $290/yr |

## 6. Deploy to Vercel

1. Push the repo to GitHub.
2. In Vercel: **Add New Project** → import the repo. Vercel auto-detects Next.js.
3. Add all environment variables from `.env.example` (Production + Preview).
4. Set `NEXT_PUBLIC_APP_URL` to the production domain (e.g. `https://stackaudit.app`).
5. Deploy. Then update:
   - Shopify Partner app URLs (app URL + callback) to the production domain.
   - Supabase Auth URL configuration (Site URL + redirect URLs).
   - Stripe webhook endpoint to `https://<domain>/api/stripe/webhook`.

Everything runs inside serverless functions — no servers to manage on the Vercel
hobby plan.

## Security notes

- Shopify access tokens are encrypted before storage (`lib/token-crypto.ts`) and
  never sent to the browser (queries select columns explicitly).
- All Supabase tables have Row Level Security; users can only read/write their own
  rows.
- Shopify OAuth callbacks verify the HMAC signature with timing-safe comparison and
  validate the `state` parameter (uid + expiry).
- Stripe webhooks verify the `stripe-signature` header.
- Auth redirects only allow same-origin relative paths (open-redirect protection).
- Secrets live exclusively in environment variables.

## Roadmap ideas

- CSV export (Pro)
- Scheduled monthly audits
- Team seats
- Spanish (es) localization
