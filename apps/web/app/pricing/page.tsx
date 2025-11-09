import { checkoutAction } from '@/lib/payments/actions';
import { Check } from 'lucide-react';
import { getStripePrices, getStripeProducts } from '@/lib/payments/stripe';
import { SubmitButton } from './submit-button';

// Prices are fresh for one hour max
export const revalidate = 3600;

export default async function PricingPage() {
  const [prices, products] = await Promise.all([
    getStripePrices(),
    getStripeProducts(),
  ]);

  const basePlan = products.find((product) => product.name === 'Base');
  const plusPlan = products.find((product) => product.name === 'Plus');

  const basePrice = prices.find((price) => price.productId === basePlan?.id);
  const plusPrice = prices.find((price) => price.productId === plusPlan?.id);

  return (
    <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16 lg:py-24 bg-gradient-to-b from-white to-gray-50/50 min-h-screen">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold text-foreground tracking-tight">
          Simple, transparent pricing
        </h1>
        <p className="mt-4 text-xl text-muted-foreground">
          Choose the plan that's right for you
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        <PricingCard
          name={basePlan?.name || 'Base'}
          price={basePrice?.unitAmount || 800}
          interval={basePrice?.interval || 'month'}
          trialDays={basePrice?.trialPeriodDays || 7}
          features={[
            'Unlimited Usage',
            'Unlimited Workspace Members',
            'Email Support',
          ]}
          priceId={basePrice?.id}
        />
        <PricingCard
          name={plusPlan?.name || 'Plus'}
          price={plusPrice?.unitAmount || 1200}
          interval={plusPrice?.interval || 'month'}
          trialDays={plusPrice?.trialPeriodDays || 7}
          features={[
            'Everything in Base, and:',
            'Early Access to New Features',
            '24/7 Support + Slack Access',
          ]}
          priceId={plusPrice?.id}
          featured
        />
      </div>
    </main>
  );
}

function PricingCard({
  name,
  price,
  interval,
  trialDays,
  features,
  priceId,
  featured = false,
}: {
  name: string;
  price: number;
  interval: string;
  trialDays: number;
  features: string[];
  priceId?: string;
  featured?: boolean;
}) {
  return (
    <div className={`p-8 rounded-2xl border transition-all duration-200 ${
      featured 
        ? 'border-primary bg-primary/5 shadow-lg scale-105' 
        : 'border-border/50 bg-white hover:border-border hover:shadow-md'
    }`}>
      {featured && (
        <div className="inline-block px-3 py-1 mb-4 text-xs font-semibold text-primary bg-primary/10 rounded-full">
          Most Popular
        </div>
      )}
      <h2 className="text-3xl font-bold text-foreground mb-2">{name}</h2>
      <p className="text-sm text-muted-foreground mb-6">
        with {trialDays} day free trial
      </p>
      <p className="text-5xl font-bold text-foreground mb-8">
        ${price / 100}{' '}
        <span className="text-xl font-normal text-muted-foreground">
          per user / {interval}
        </span>
      </p>
      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
            <span className="text-foreground">{feature}</span>
          </li>
        ))}
      </ul>
      <form action={checkoutAction}>
        <input type="hidden" name="priceId" value={priceId} />
        <SubmitButton featured={featured} />
      </form>
    </div>
  );
}
