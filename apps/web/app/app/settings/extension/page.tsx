'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chrome, Check, Copy } from 'lucide-react';

export default function ExtensionSettingsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if opened from extension
  const isFromExtension = typeof window !== 'undefined' && 
    new URLSearchParams(window.location.search).get('extension') === 'true';

  useEffect(() => {
    // Auto-generate token if opened from extension
    if (isFromExtension && !token) {
      handleGenerateToken();
    }
  }, [isFromExtension]);

  const handleGenerateToken = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/extension/auth', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to generate token');
      }

      const data = await response.json();
      setToken(data.token);
      setExpiresIn(data.expiresIn);

      // If opened from extension, send token via postMessage
      if (isFromExtension && window.opener) {
        // Send token to extension via chrome.runtime.sendMessage
        // The extension's background script will listen for this
        const chromeAPI = (window as any).chrome;
        if (typeof chromeAPI !== 'undefined' && chromeAPI.runtime) {
          chromeAPI.runtime.sendMessage({
            type: 'AUTH_TOKEN',
            token: data.token,
            expiresIn: data.expiresIn,
          });
        }

        // Close this tab after 2 seconds
        setTimeout(() => {
          window.close();
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate token');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50/50 p-6 lg:p-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Chrome Extension</h1>
          <p className="text-muted-foreground">
            Connect the ReplyGenie Chrome extension to your account
          </p>
        </div>

        {isFromExtension && (
          <Card className="p-6 mb-6 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <Chrome className="size-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">
                  Extension Authentication
                </h3>
                <p className="text-sm text-blue-700">
                  {token 
                    ? 'Authentication successful! This tab will close automatically.'
                    : 'Generating authentication token for your extension...'}
                </p>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">How It Works</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Install the ReplyGenie Chrome extension</li>
                <li>Click "Connect to ReplyGenie" in the extension popup</li>
                <li>This page will open and authenticate automatically</li>
                <li>Start generating drafts on Google Business Profile pages!</li>
              </ol>
            </div>

            {!isFromExtension && (
              <>
                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-3">Manual Token Generation</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate a token manually if automatic authentication fails.
                  </p>

                  <Button
                    onClick={handleGenerateToken}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? 'Generating...' : 'Generate Extension Token'}
                  </Button>

                  {error && (
                    <p className="text-sm text-red-600 mt-3">{error}</p>
                  )}
                </div>

                {token && (
                  <div className="border-t pt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">Your Token</h3>
                      <span className="text-xs text-muted-foreground">
                        Expires in {Math.floor((expiresIn || 0) / 60)} minutes
                      </span>
                    </div>

                    <div className="relative">
                      <div className="p-3 bg-gray-50 rounded-lg font-mono text-xs break-all border">
                        {token}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCopyToken}
                        className="absolute top-2 right-2"
                      >
                        {copied ? (
                          <Check className="size-4 text-green-600" />
                        ) : (
                          <Copy className="size-4" />
                        )}
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground mt-3">
                      Copy this token and paste it in the extension if automatic
                      authentication didn't work.
                    </p>
                  </div>
                )}
              </>
            )}

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-3">Extension Features</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Generate drafts directly on Google Business Profile pages</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Secure authentication with short-lived tokens</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Automatic draft insertion into reply textarea</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>Fallback to web app if injection fails</span>
                </li>
              </ul>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-3">Security</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">🔒</span>
                  <span>No Google OAuth tokens stored in extension</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">🔒</span>
                  <span>Tokens expire after 15 minutes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">🔒</span>
                  <span>Limited to business.google.com domain only</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>

        <div className="mt-6 text-center">
          <a
            href="https://github.com/yourusername/replygenie/tree/main/apps/extension"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            View extension documentation →
          </a>
        </div>
      </div>
    </div>
  );
}
