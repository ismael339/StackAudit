import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple pricing for StackAudit. Start free, upgrade to Pro for unlimited audits and stores.",
};

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/forever",
    description: "Perfect for store owners who want to see where the money goes.",
    features: [
      "1 connected store",
      "3 audits per month",
      "Redundancy detection",
      "Savings recommendations",
    ],
    cta: "Start free",
    href: "/signup",
    variant: "outline" as const,
    highlight: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    subNote: "or $290/year (save 17%)",
    description: "For growing merchants and agencies managing multiple stores.",
    features: [
      "Unlimited stores",
      "Unlimited audits",
      "Full audit history",
      "Export to CSV",
      "Priority support",
      "Everything in Free, unlimited",
    ],
    cta: "Upgrade to Pro",
    href: "/signup?plan=pro",
    variant: "default" as const,
    highlight: true,
  },
];

const faqs = [
  {
    q: "How does the free plan work?",
    a: "You can connect one Shopify store and run up to three audits per month — no credit card required. Upgrade any time for unlimited access.",
  },
  {
    q: "Can I cancel Pro anytime?",
    a: "Yes. Cancel from the Stripe customer portal in one click. You keep Pro access until the end of the billing period.",
  },
  {
    q: "Do you store my Shopify data?",
    a: "We store your store domain and an encrypted access token needed to list installed apps. We never access orders or customer data.",
  },
  {
    q: "What is the yearly discount?",
    a: "Pro yearly is $290 — two months free compared to paying monthly.",
  },
];

export default function PricingPage() {
  return (
    <div className="container py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Pricing that pays for itself
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Most merchants save more in the first audit than Pro costs in a year.
        </p>
      </div>

      <div className="mx-auto mt-14 grid max-w-3xl gap-8 md:grid-cols-2">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={plan.highlight ? "relative border-primary shadow-lg" : ""}
          >
            {plan.highlight && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                Most popular
              </Badge>
            )}
            <CardHeader className="text-center">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
              {plan.subNote && (
                <p className="text-sm text-muted-foreground">{plan.subNote}</p>
              )}
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-success"
                      aria-hidden="true"
                    />
                    {f}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild variant={plan.variant} className="w-full">
                <Link href={plan.href}>{plan.cta}</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mx-auto mt-20 max-w-2xl">
        <h2 className="text-center text-2xl font-bold tracking-tight">
          Frequently asked questions
        </h2>
        <dl className="mt-8 space-y-6">
          {faqs.map((faq) => (
            <div key={faq.q} className="rounded-lg border bg-card p-5">
              <dt className="font-medium">{faq.q}</dt>
              <dd className="mt-2 text-sm text-muted-foreground">{faq.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
