import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PricingCards } from "./pricing-cards";

export const metadata = {
  title: "Choose Your Plan — SupportAI",
};

export default async function PricingPage() {
  const { userId, orgId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  if (!orgId) {
    redirect("/select-org");
  }

  const marketingUrl =
    process.env.NEXT_PUBLIC_MARKETING_URL ?? "http://localhost:3003";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Choose Your Plan
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Start with a plan that fits your team. Upgrade or downgrade anytime.
          All plans include a 14-day free trial.
        </p>
      </div>

      <PricingCards marketingUrl={marketingUrl} />

      <p className="text-center text-xs text-muted-foreground">
        All plans are billed monthly. Cancel anytime. Need help choosing?{" "}
        <a
          href={`${marketingUrl}/contact`}
          className="text-foreground underline underline-offset-4 hover:text-primary"
        >
          Talk to our team
        </a>
      </p>
    </div>
  );
}
