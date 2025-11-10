import { Button } from '@/components/ui/button';
import { ArrowRight, MessageSquare, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-semibold text-foreground tracking-tight sm:text-5xl md:text-6xl">
              Reply to every review.
              <span className="block text-primary mt-1">Effortlessly.</span>
            </h1>
            <p className="mt-6 text-base text-muted-foreground sm:text-lg max-w-2xl mx-auto">
              AI-powered drafts for Google Business Profile reviews. Approve and post in seconds.
            </p>
            <div className="mt-8 flex gap-3 justify-center">
              <Link href="/sign-up">
                <Button size="lg" className="shadow-sm">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline">
                  View Pricing
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              14-day free trial · No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 bg-secondary/30">
        <div className="max-w-6xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
              Simple. Powerful. Fast.
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 text-primary mb-4">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-base font-medium text-foreground mb-2">
                AI-Powered Drafts
              </h3>
              <p className="text-sm text-muted-foreground">
                Generate authentic responses in seconds
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 text-primary mb-4">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="text-base font-medium text-foreground mb-2">
                One-Click Posting
              </h3>
              <p className="text-sm text-muted-foreground">
                Review, edit, and post directly to Google
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 text-primary mb-4">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-base font-medium text-foreground mb-2">
                Chrome Extension
              </h3>
              <p className="text-sm text-muted-foreground">
                Draft replies right on Google Business Profile
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 text-center">
          <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">
            Ready to get started?
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Join businesses managing reviews faster with ReplyGenie.
          </p>
          <div className="mt-8">
            <Link href="/sign-up">
              <Button size="lg" className="shadow-sm">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
