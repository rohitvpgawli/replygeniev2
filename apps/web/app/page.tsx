import { Button } from '@/components/ui/button';
import { ArrowRight, MessageSquare, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="bg-gradient-to-b from-white to-gray-50/50">
      {/* Hero Section */}
      <section className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-foreground tracking-tight sm:text-6xl md:text-7xl leading-tight">
              Reply to Every Review
              <span className="block text-primary mt-2">In Seconds</span>
            </h1>
            <p className="mt-8 text-lg text-muted-foreground sm:text-xl leading-relaxed max-w-2xl mx-auto">
              AI-powered review response management for Google Business Profile. 
              Draft, approve, and post authentic replies that strengthen your reputation.
            </p>
            <div className="mt-10 flex gap-4 justify-center">
              <Link href="/sign-up">
                <Button
                  size="lg"
                  variant="default"
                  className="text-base shadow-lg hover:shadow-xl"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base shadow-sm hover:shadow-lg"
                >
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-28 bg-white w-full">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Simple, Powerful, Effective
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage review responses professionally
            </p>
          </div>
          
          <div className="lg:grid lg:grid-cols-3 lg:gap-12">
            <div className="group">
              <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 mx-auto">
                <Sparkles className="h-8 w-8" />
              </div>
              <div className="mt-6 text-center">
                <h3 className="text-xl font-semibold text-foreground">
                  AI-Powered Drafts
                </h3>
                <p className="mt-3 text-base text-muted-foreground leading-relaxed">
                  Generate authentic, personalized responses in seconds. Our AI references specific details from each review.
                </p>
              </div>
            </div>

            <div className="mt-12 lg:mt-0 group">
              <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 mx-auto">
                <MessageSquare className="h-8 w-8" />
              </div>
              <div className="mt-6 text-center">
                <h3 className="text-xl font-semibold text-foreground">
                  One-Click Approval
                </h3>
                <p className="mt-3 text-base text-muted-foreground leading-relaxed">
                  Review, edit if needed, and post directly to Google Business Profile with a single click.
                </p>
              </div>
            </div>

            <div className="mt-12 lg:mt-0 group">
              <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 mx-auto">
                <Zap className="h-8 w-8" />
              </div>
              <div className="mt-6 text-center">
                <h3 className="text-xl font-semibold text-foreground">
                  Chrome Extension
                </h3>
                <p className="mt-3 text-base text-muted-foreground leading-relaxed">
                  Generate drafts directly on Google Business Profile pages. Work where you already manage reviews.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 lg:py-32 bg-gradient-to-b from-gray-50/50 to-white">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <h2 className="text-4xl font-bold text-foreground sm:text-5xl leading-tight">
            Ready to Transform Your Review Management?
          </h2>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            Join businesses that reply to reviews faster and more consistently with ReplyGenie.
          </p>
          <div className="mt-10">
            <Link href="/sign-up">
              <Button
                size="lg"
                variant="default"
                className="text-base shadow-lg hover:shadow-xl"
              >
                Start Free Trial
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            14-day free trial • No credit card required • Cancel anytime
          </p>
        </div>
      </section>
    </main>
  );
}
