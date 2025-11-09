'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface Location {
  id: number;
  name: string;
  address: string;
  isVerified: boolean;
  lastSyncAt: string | null;
}

interface ConnectionStatus {
  connected: boolean;
  connectedAt?: string;
  lastSyncAt?: string;
}

export default function IntegrationsPage() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ connected: false });
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<number | null>(null);
  const [syncingLocations, setSyncingLocations] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for OAuth callback messages
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'connected') {
      setMessage({ type: 'success', text: 'Successfully connected to Google Business Profile!' });
    } else if (error) {
      const errorMessages: Record<string, string> = {
        oauth_denied: 'OAuth access was denied',
        invalid_request: 'Invalid OAuth request',
        invalid_state: 'Invalid state parameter',
        unauthorized: 'Unauthorized access',
        no_team: 'No team found for your account',
        token_exchange_failed: 'Failed to exchange authorization code',
        no_refresh_token: 'No refresh token received from Google',
        encryption_failed: 'Failed to encrypt tokens',
        server_error: 'Server error occurred',
      };
      setMessage({ 
        type: 'error', 
        text: errorMessages[error] || 'An error occurred during connection' 
      });
    }

    loadData();
  }, [searchParams]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load connection status
      const statusRes = await fetch('/api/v1/connection/status');
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setConnectionStatus(statusData);
      }

      // Load locations if connected
      const locationsRes = await fetch('/api/v1/locations');
      if (locationsRes.ok) {
        const locationsData = await locationsRes.json();
        setLocations(Array.isArray(locationsData) ? locationsData : []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    window.location.href = '/api/google/oauth/start';
  };

  const handleSyncLocations = async () => {
    try {
      setSyncingLocations(true);
      const response = await fetch('/api/v1/locations/sync', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ 
          type: 'success', 
          text: `Synced ${data.count} locations` 
        });
        await loadData();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to sync locations' });
      }
    } catch (error) {
      console.error('Error syncing locations:', error);
      setMessage({ type: 'error', text: 'Failed to sync locations' });
    } finally {
      setSyncingLocations(false);
    }
  };

  const handleSyncReviews = async (locationId: number) => {
    try {
      setSyncing(locationId);
      const response = await fetch('/api/v1/reviews/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ 
          type: 'success', 
          text: `Synced ${data.newReviews} new reviews (${data.totalReviews} total)` 
        });
        await loadData();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to sync reviews' });
      }
    } catch (error) {
      console.error('Error syncing reviews:', error);
      setMessage({ type: 'error', text: 'Failed to sync reviews' });
    } finally {
      setSyncing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <p className="text-muted-foreground">
          Connect your Google Business Profile to start managing reviews
        </p>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-900 border border-green-200'
              : 'bg-red-50 text-red-900 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          )}
          <p className="flex-1">{message.text}</p>
          <button
            onClick={() => setMessage(null)}
            className="text-current opacity-60 hover:opacity-100"
          >
            ×
          </button>
        </div>
      )}

        {/* Google Business Profile Card */}
        <Card className="rounded-2xl border-border/50 p-8 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-semibold mb-1">Google Business Profile</h2>
                <p className="text-muted-foreground">
                  Manage reviews from your Google Business locations
                </p>
              </div>
            </div>
            {connectionStatus.connected && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full border border-green-200">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">Connected</span>
              </div>
            )}
          </div>

          {!connectionStatus.connected ? (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Connect your Google account to sync locations and manage review replies.
              </p>
              <Button
                onClick={handleConnect}
                className="h-11 px-6 rounded-xl shadow-sm active:scale-[0.98] transition-transform"
              >
                Connect Google Business Profile
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Connected {connectionStatus.connectedAt && `on ${new Date(connectionStatus.connectedAt).toLocaleDateString()}`}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSyncLocations}
                    disabled={syncingLocations}
                    className="rounded-xl"
                  >
                    {syncingLocations ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sync Locations
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleConnect}
                    className="rounded-xl"
                  >
                    Reconnect
                  </Button>
                </div>
              </div>

              {/* Locations */}
              {locations.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Locations</h3>
                  <div className="space-y-3">
                    {locations.map((location) => (
                      <div
                        key={location.id}
                        className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:border-border transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{location.name}</h4>
                            {location.isVerified && (
                              <CheckCircle2 className="h-4 w-4 text-blue-600" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{location.address}</p>
                          {location.lastSyncAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Last synced: {new Date(location.lastSyncAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSyncReviews(location.id)}
                          disabled={syncing === location.id || !location.isVerified}
                          className="rounded-xl ml-4"
                        >
                          {syncing === location.id ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Syncing...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Sync Reviews
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {locations.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No locations found</p>
                  <Button
                    variant="outline"
                    onClick={loadData}
                    className="rounded-xl"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Help Section */}
        <div className="mt-8 p-6 rounded-xl bg-blue-50 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Need Help?
          </h3>
          <p className="text-sm text-blue-800">
            Make sure your Google Business Profile locations are verified. Only verified locations can receive review replies.
          </p>
        </div>
    </div>
  );
}
