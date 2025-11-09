'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, MessageSquare } from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type BrandVoiceData = {
  brandVoiceGuidance: string | null;
  contactChannel: string | null;
};

export default function BrandVoicePage() {
  const { data: teamData, mutate } = useSWR<BrandVoiceData>(
    '/api/v1/brand-voice',
    fetcher
  );

  const [brandVoice, setBrandVoice] = useState('');
  const [contactChannel, setContactChannel] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  // Initialize form with fetched data
  useEffect(() => {
    if (teamData) {
      setBrandVoice(teamData.brandVoiceGuidance || '');
      setContactChannel(teamData.contactChannel || '');
    }
  }, [teamData]);

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSaveSuccess(false);

    try {
      const response = await fetch('/api/v1/brand-voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brandVoiceGuidance: brandVoice.trim() || null,
          contactChannel: contactChannel.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save brand voice settings');
      }

      await mutate();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  if (!teamData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl">
      <div className="mb-6">
        <p className="text-muted-foreground">
          Customize how AI generates replies to match your business tone and style
        </p>
      </div>

        {/* Main Card */}
        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="size-5" />
              Reply Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Brand Voice Guidance */}
            <div>
              <Label htmlFor="brandVoice" className="text-base font-semibold mb-3 block">
                Tone & Style Guidance
              </Label>
              <Textarea
                id="brandVoice"
                value={brandVoice}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setBrandVoice(e.target.value)
                }
                placeholder="e.g., Friendly and professional. Use first-person plural (we, our). Emphasize quality and customer care."
                className="h-32 rounded-xl focus:ring-primary/20 resize-none"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Describe your brand's voice and tone. This guides the AI to match your
                communication style.
              </p>
            </div>

            {/* Contact Channel for Negative Reviews */}
            <div>
              <Label htmlFor="contactChannel" className="text-base font-semibold mb-3 block">
                Contact Channel (for negative reviews)
              </Label>
              <Input
                id="contactChannel"
                value={contactChannel}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setContactChannel(e.target.value)
                }
                placeholder="e.g., call us at (555) 123-4567 or email support@business.com"
                className="h-11 rounded-xl focus:ring-primary/20"
              />
              <p className="text-sm text-muted-foreground mt-2">
                How should customers reach you privately to resolve issues? This is
                included in replies to 1-3 star reviews.
              </p>
            </div>

            {/* Example Preview */}
            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
              <h4 className="font-semibold text-sm text-blue-900 mb-2">
                Example Usage
              </h4>
              <p className="text-sm text-foreground leading-relaxed">
                For a <strong>5-star review</strong>: AI will write an appreciative
                response using your tone guidance.
              </p>
              <p className="text-sm text-foreground leading-relaxed mt-2">
                For a <strong>2-star review</strong>: AI will apologize, acknowledge the
                issue, and invite them to {contactChannel || 'contact you directly'}.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {saveSuccess && (
              <div className="p-4 bg-green-50 rounded-xl border border-green-200 flex items-center gap-2">
                <CheckCircle2 className="size-5 text-green-600" />
                <p className="text-sm text-green-800 font-medium">
                  Brand voice settings saved successfully!
                </p>
              </div>
            )}

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full h-11 rounded-xl shadow-sm active:scale-[0.98] transition-transform"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 size-4" />
                  Save Settings
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card className="mt-6 rounded-2xl border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Tips for Better Replies</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span>
                  <strong>Be specific</strong> about your tone (e.g., "warm and casual"
                  vs. "formal and professional")
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span>
                  <strong>Mention pronouns</strong> you prefer (we/our vs. I/my)
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span>
                  <strong>Highlight values</strong> you want to emphasize (quality,
                  speed, community, etc.)
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold">•</span>
                <span>
                  <strong>Provide a direct contact method</strong> for resolving issues
                  privately
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
    </div>
  );
}
