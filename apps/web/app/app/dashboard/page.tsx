'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import useSWR from 'swr';
import {
  MessageSquare,
  CheckCircle2,
  Star,
  TrendingUp,
  Loader2,
  ArrowRight,
  Inbox as InboxIcon,
  Clock,
} from 'lucide-react';
import { RcReview, RcLocation } from '@/lib/db/schema';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type DashboardStats = {
  needingReply: number;
  repliesPosted30d: number;
  avgResponseTime: string;
  totalReviews: number;
};

type ReviewWithLocation = RcReview & {
  location: RcLocation;
};

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useSWR<DashboardStats>(
    '/api/v1/dashboard/stats',
    fetcher
  );
  const { data: recentReviews, isLoading: reviewsLoading } = useSWR<ReviewWithLocation[]>(
    '/api/v1/dashboard/recent-reviews',
    fetcher
  );

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`size-3 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getStatusBadge = (status: string, replied: boolean) => {
    if (replied || status === 'posted') {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200 text-xs">
          <CheckCircle2 className="size-3 mr-1" />
          Posted
        </Badge>
      );
    }
    if (status === 'drafted') {
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200 text-xs">
          Draft Ready
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200 text-xs">
        Pending
      </Badge>
    );
  };

  if (statsLoading || reviewsLoading) {
    return (
      <section className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12 bg-gradient-to-b from-white to-gray-50/50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  return (
    <section className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12 bg-gradient-to-b from-white to-gray-50/50 min-h-screen">
      <div className="w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-2">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">
            Overview of your review management activity
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Needing Reply */}
          <Card className="rounded-2xl border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="size-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <MessageSquare className="size-6 text-orange-600" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Needing Reply
                </p>
                <p className="text-5xl font-bold text-foreground">
                  {stats?.needingReply || 0}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Replies Posted (30d) */}
          <Card className="rounded-2xl border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="size-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="size-6 text-green-600" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Replies (30d)
                </p>
                <p className="text-5xl font-bold text-foreground">
                  {stats?.repliesPosted30d || 0}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Avg Response Time */}
          <Card className="rounded-2xl border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="size-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Clock className="size-6 text-blue-600" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Avg Response
                </p>
                <p className="text-5xl font-bold text-foreground">
                  {stats?.avgResponseTime || '—'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Total Reviews */}
          <Card className="rounded-2xl border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="size-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <TrendingUp className="size-6 text-purple-600" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Total Reviews
                </p>
                <p className="text-5xl font-bold text-foreground">
                  {stats?.totalReviews || 0}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Reviews Table */}
        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Recent Reviews</CardTitle>
              <Link href="/app/inbox">
                <Button variant="outline" size="sm" className="rounded-xl">
                  View All
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {!recentReviews || recentReviews.length === 0 ? (
              <div className="p-12 text-center">
                <InboxIcon className="size-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold mb-2">No reviews yet</h3>
                <p className="text-muted-foreground mb-6">
                  Connect your Google Business Profile and sync reviews to get started.
                </p>
                <Link href="/app/settings/integrations">
                  <Button className="h-11 px-6 rounded-xl">
                    Go to Settings
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {recentReviews.slice(0, 5).map((review) => (
                  <div
                    key={review.id}
                    className="p-6 hover:bg-gray-50/50 transition-colors duration-150"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold">
                            {review.reviewerName || 'Anonymous'}
                          </h4>
                          {renderStars(review.starRating)}
                          {getStatusBadge(review.status, review.replied)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {review.location.name} •{' '}
                          {formatDistanceToNow(new Date(review.reviewCreateTime), {
                            addSuffix: true,
                          })}
                        </p>
                        {review.comment && (
                          <p className="text-sm text-foreground line-clamp-2">
                            {review.comment}
                          </p>
                        )}
                      </div>
                      <Link href="/app/inbox">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-xl ml-4"
                        >
                          View
                          <ArrowRight className="ml-2 size-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
