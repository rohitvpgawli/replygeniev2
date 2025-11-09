'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Star,
  MessageSquare,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Edit3,
  Send,
  Inbox as InboxIcon,
} from 'lucide-react';
import { RcReview, RcLocation, RcDraft } from '@/lib/db/schema';
import { formatDistanceToNow } from 'date-fns';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type ReviewWithDraft = RcReview & {
  location: RcLocation;
  draft?: RcDraft;
};

type InboxFilters = {
  locationId: string;
  rating: string;
  status: string;
};

export default function InboxPage() {
  const [filters, setFilters] = useState<InboxFilters>({
    locationId: 'all',
    rating: 'all',
    status: 'all',
  });
  const [editingDraftId, setEditingDraftId] = useState<number | null>(null);
  const [editedText, setEditedText] = useState('');
  const [generatingDraftId, setGeneratingDraftId] = useState<number | null>(null);
  const [postingReplyId, setPostingReplyId] = useState<number | null>(null);

  // Fetch locations for filter
  const { data: locations } = useSWR<RcLocation[]>('/api/v1/locations', fetcher);

  // Fetch reviews with drafts
  const { data: reviews, mutate } = useSWR<ReviewWithDraft[]>(
    `/api/v1/reviews?locationId=${filters.locationId}&rating=${filters.rating}&status=${filters.status}`,
    fetcher
  );

  const handleGenerateDraft = async (reviewId: number) => {
    setGeneratingDraftId(reviewId);
    try {
      const response = await fetch(`/api/v1/drafts/${reviewId}`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to generate draft');
      await mutate();
    } catch (error) {
      console.error('Error generating draft:', error);
    } finally {
      setGeneratingDraftId(null);
    }
  };

  const handleRegenerateDraft = async (reviewId: number) => {
    setGeneratingDraftId(reviewId);
    try {
      // Delete existing draft first
      await fetch(`/api/v1/drafts/${reviewId}`, {
        method: 'DELETE',
      });
      // Generate new draft
      const response = await fetch(`/api/v1/drafts/${reviewId}`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to regenerate draft');
      await mutate();
    } catch (error) {
      console.error('Error regenerating draft:', error);
    } finally {
      setGeneratingDraftId(null);
    }
  };

  const handleEditDraft = (draftId: number, currentText: string) => {
    setEditingDraftId(draftId);
    setEditedText(currentText);
  };

  const handleSaveEdit = async (reviewId: number) => {
    try {
      const response = await fetch(`/api/v1/drafts/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editedText }),
      });
      if (!response.ok) throw new Error('Failed to save edit');
      await mutate();
      setEditingDraftId(null);
      setEditedText('');
    } catch (error) {
      console.error('Error saving edit:', error);
    }
  };

  const handleApproveAndPost = async (reviewId: number, draftText: string) => {
    setPostingReplyId(reviewId);
    try {
      const response = await fetch(`/api/v1/replies/${reviewId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: draftText }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to post reply');
      }
      await mutate();
    } catch (error) {
      console.error('Error posting reply:', error);
      alert(error instanceof Error ? error.message : 'Failed to post reply');
    } finally {
      setPostingReplyId(null);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`size-4 ${
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
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
          <CheckCircle2 className="size-3 mr-1" />
          Posted
        </Badge>
      );
    }
    if (status === 'drafted') {
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">
          <Edit3 className="size-3 mr-1" />
          Draft Ready
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200">
        <MessageSquare className="size-3 mr-1" />
        Pending
      </Badge>
    );
  };

  if (!reviews) {
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
      <div className="w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
            Review Inbox
          </h1>
          <p className="text-muted-foreground">
            Generate, edit, and post replies to your Google Business Profile reviews
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6 rounded-2xl border-border/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Location</label>
                <Select
                  value={filters.locationId}
                  onValueChange={(value: string) =>
                    setFilters({ ...filters, locationId: value })
                  }
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations?.map((location) => (
                      <SelectItem key={location.id} value={location.id.toString()}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Rating</label>
                <Select
                  value={filters.rating}
                  onValueChange={(value: string) =>
                    setFilters({ ...filters, rating: value })
                  }
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="All Ratings" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ratings</SelectItem>
                    <SelectItem value="5">5 Stars</SelectItem>
                    <SelectItem value="4">4 Stars</SelectItem>
                    <SelectItem value="3">3 Stars</SelectItem>
                    <SelectItem value="2">2 Stars</SelectItem>
                    <SelectItem value="1">1 Star</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select
                  value={filters.status}
                  onValueChange={(value: string) =>
                    setFilters({ ...filters, status: value })
                  }
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="drafted">Draft Ready</SelectItem>
                    <SelectItem value="posted">Posted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardContent className="p-12 text-center">
              <InboxIcon className="size-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-2xl font-semibold mb-2">No reviews found</h3>
              <p className="text-muted-foreground mb-6">
                {filters.locationId !== 'all' ||
                filters.rating !== 'all' ||
                filters.status !== 'all'
                  ? 'Try adjusting your filters to see more reviews.'
                  : 'Connect your Google Business Profile and sync reviews to get started.'}
              </p>
              {filters.locationId === 'all' &&
                filters.rating === 'all' &&
                filters.status === 'all' && (
                  <Button
                    onClick={() => (window.location.href = '/app/settings/integrations')}
                    className="h-11 px-6 rounded-xl"
                  >
                    Go to Settings
                  </Button>
                )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card
                key={review.id}
                className="rounded-2xl border-border/50 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <CardContent className="p-6">
                  {/* Review Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          {review.reviewerName || 'Anonymous'}
                        </h3>
                        {renderStars(review.starRating)}
                        {getStatusBadge(review.status, review.replied)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {review.location.name} •{' '}
                        {formatDistanceToNow(new Date(review.reviewCreateTime), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Review Text */}
                  {review.comment && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                      <p className="text-foreground leading-relaxed">
                        {review.comment}
                      </p>
                    </div>
                  )}

                  {/* Draft Section */}
                  {review.draft && (
                    <div className="mt-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-sm text-blue-900">
                          Draft Reply
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-blue-700">
                          <span>
                            {review.draft.wordCount} words • {review.draft.charCount}{' '}
                            chars
                          </span>
                        </div>
                      </div>
                      {editingDraftId === review.draft.id ? (
                        <div className="space-y-3">
                          <Textarea
                            value={editedText}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditedText(e.target.value)}
                            className="min-h-32 rounded-xl"
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleSaveEdit(review.id)}
                              size="sm"
                              className="h-9 px-4 rounded-xl"
                            >
                              Save Changes
                            </Button>
                            <Button
                              onClick={() => {
                                setEditingDraftId(null);
                                setEditedText('');
                              }}
                              size="sm"
                              variant="outline"
                              className="h-9 px-4 rounded-xl"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                          {review.draft.draftText}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {!review.replied && !review.draft && (
                      <Button
                        onClick={() => handleGenerateDraft(review.id)}
                        disabled={generatingDraftId === review.id}
                        className="h-11 px-6 rounded-xl shadow-sm active:scale-[0.98] transition-transform"
                      >
                        {generatingDraftId === review.id ? (
                          <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <MessageSquare className="mr-2 size-4" />
                            Generate Draft
                          </>
                        )}
                      </Button>
                    )}

                    {!review.replied && review.draft && editingDraftId !== review.draft.id && (
                      <>
                        <Button
                          onClick={() => handleRegenerateDraft(review.id)}
                          disabled={generatingDraftId === review.id}
                          variant="outline"
                          className="h-11 px-6 rounded-xl"
                        >
                          {generatingDraftId === review.id ? (
                            <>
                              <Loader2 className="mr-2 size-4 animate-spin" />
                              Regenerating...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="mr-2 size-4" />
                              Regenerate
                            </>
                          )}
                        </Button>

                        <Button
                          onClick={() =>
                            handleEditDraft(review.draft!.id, review.draft!.draftText)
                          }
                          variant="outline"
                          className="h-11 px-6 rounded-xl"
                        >
                          <Edit3 className="mr-2 size-4" />
                          Edit
                        </Button>

                        <Button
                          onClick={() =>
                            handleApproveAndPost(review.id, review.draft!.draftText)
                          }
                          disabled={postingReplyId === review.id}
                          className="h-11 px-6 rounded-xl bg-green-600 hover:bg-green-700 text-white shadow-sm active:scale-[0.98] transition-transform"
                        >
                          {postingReplyId === review.id ? (
                            <>
                              <Loader2 className="mr-2 size-4 animate-spin" />
                              Posting...
                            </>
                          ) : (
                            <>
                              <Send className="mr-2 size-4" />
                              Approve & Post
                            </>
                          )}
                        </Button>
                      </>
                    )}

                    {review.replied && (
                      <div className="flex items-center gap-2 text-sm text-green-700">
                        <CheckCircle2 className="size-4" />
                        <span>Reply posted successfully</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
