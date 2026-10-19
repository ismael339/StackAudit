import Link from "next/link";
import {
  ArrowRight,
  AlertTriangle,
  Layers,
  PiggyBank,
  LineChart,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LandingPage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,theme(colors.indigo.500/12),transparent_60%)]"
        />
        <div className="container relative py-20 text-center md:py-28">
          <p className="mx-auto mb-4 inline-flex items-center rounded-full border bg-muted/60 px-4 py-1.5 text-sm text-muted-foreground animate-fade-in">
            <Zap className="mr-1.5 h-3.5 w-3.5 text-primary" aria-hidden="true" />
            Built for Shopify merchants who hate waste
          </p>
          <h1 className="mx-auto max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl animate-fade-in">
            Audit your Shopify app stack.
            <br />
            <span className="gradient-text">Cut waste. Save money.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-muted-foreground animate-fade-in">
            Connect your store, see every app you pay for, spot the duplicates and
            overpriced tools, and get a clear action plan to reduce your monthly bill.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row animate-fade-in">
            <Button asChild size="lg" className="h-11 px-8">
              <Link href="/signup">
                Start your free audit
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-11 px-8">
              <Link href="/pricing">See pricing</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Free plan: 1 store · 3 audits per month. No credit card required.
          </p>

          {/* Mock dashboard preview */}
          <div className="relative mx-auto mt-14 max-w-4xl rounded-xl border bg-card p-2 shadow-2xl shadow-primary/10">
            <div className="grid gap-3 rounded-lg bg-muted/40 p-4 sm:grid-cols-3">
              <div className="rounded-lg bg-card p-4 text-left">
                <p className="text-xs text-muted-foreground">Monthly app spend</p>
                <p className="mt-1 text-2xl font-bold">$247</p>
              </div>
              <div className="rounded-lg bg-card p-4 text-left">
                <p className="text-xs text-muted-foreground">Installed apps</p>
                <p className="mt-1 text-2xl font-bold">23</p>
              </div>
              <div className="rounded-lg bg-card p-4 text-left">
                <p className="text-xs text-muted-foreground">Potential savings</p>
                <p className="mt-1 text-2xl font-bold text-success">$89/mo</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Problem → Solution ───────────────────────────── */}
      <section className="border-t bg-muted/30 py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              App creep is quietly draining your margin
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              The average Shopify merchant runs 6+ paid apps — and can&apos;t name half of them.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <AlertTriangle className="mb-2 h-6 w-6 text-warning" aria-hidden="true" />
                <CardTitle>The problem</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Apps pile up one free trial at a time. Duplicates overlap, plans upgrade
                themselves, and nobody audits the bill until it hurts.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Layers className="mb-2 h-6 w-6 text-primary" aria-hidden="true" />
                <CardTitle>How StackAudit helps</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                We connect to your store, list every installed app, auto-detect redundant
                categories and flag anything suspiciously expensive.
              </CardContent>
            </Card>
            <Card className="border-success/40">
              <CardHeader>
                <PiggyBank className="mb-2 h-6 w-6 text-success" aria-hidden="true" />
                <CardTitle>The result</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                A prioritized savings plan with concrete alternatives — often paying for
                itself in the first week.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────── */}
      <section id="features" className="py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to cut your app bill
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Fast, focused, and built for merchants — not agencies.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Layers,
                title: "Complete app inventory",
                body: "One-click sync pulls every installed app from your store so you finally see the full picture.",
              },
              {
                icon: LineChart,
                title: "Live cost tracking",
                body: "Edit monthly costs inline and watch totals, per-category spend and savings update in real time.",
              },
              {
                icon: AlertTriangle,
                title: "Redundancy detection",
                body: "Two review apps? Three pop-up tools? We flag overlapping categories automatically.",
              },
              {
                icon: PiggyBank,
                title: "Savings recommendations",
                body: "Concrete alternatives with estimated prices — free tiers and cheaper tools for every category.",
              },
              {
                icon: ShieldCheck,
                title: "Secure by design",
                body: "Read-only Shopify scopes, encrypted tokens, and row-level security keep your data yours.",
              },
              {
                icon: Zap,
                title: "Audits in under a minute",
                body: "Connect your store and get a full audit with an action plan before your coffee cools.",
              },
            ].map((feature) => (
              <Card key={feature.title} className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <feature.icon
                    className="mb-2 h-6 w-6 text-primary"
                    aria-hidden="true"
                  />
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {feature.body}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social proof ─────────────────────────────────── */}
      <section className="border-t bg-muted/30 py-16">
        <div className="container">
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
            {[
              {
                quote:
                  "Found two review apps doing the same job. StackAudit paid for a year of Pro in one afternoon.",
                author: "Sarah M.",
                store: "Apparel brand, $40k/mo",
              },
              {
                quote:
                  "I had no idea my 'free' apps had quietly upgraded themselves. The audit was brutal — and useful.",
                author: "James K.",
                store: "Home goods, 9 apps",
              },
              {
                quote:
                  "Finally a tool that treats app spend like inventory. Clean, fast, no fluff.",
                author: "Priya R.",
                store: "Beauty brand, 14 apps",
              },
            ].map((t) => (
              <figure key={t.author} className="rounded-lg border bg-card p-6">
                <blockquote className="text-sm text-muted-foreground">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-4 text-sm font-medium">
                  {t.author}{" "}
                  <span className="font-normal text-muted-foreground">· {t.store}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing teaser ───────────────────────────────── */}
      <section className="py-20">
        <div className="container text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple pricing. Obvious ROI.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Start free. Upgrade to Pro for unlimited stores, unlimited audits, history
            and export — less than most Shopify apps charge per month.
          </p>
          <div className="mt-8">
            <Button asChild size="lg" className="h-11 px-8">
              <Link href="/pricing">
                View plans
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────── */}
      <section className="border-t bg-primary py-20 text-primary-foreground">
        <div className="container text-center">
          <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            Stop paying for apps you don&apos;t need
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg opacity-90">
            Run your first audit in under two minutes. Free plan included — no credit
            card required.
          </p>
          <div className="mt-8">
            <Button asChild size="lg" variant="secondary" className="h-11 px-8">
              <Link href="/signup">
                Start your free audit
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
