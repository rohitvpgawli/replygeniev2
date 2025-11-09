'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Building2, MapPin, Phone, Globe, CheckCircle2, XCircle } from 'lucide-react';
import useSWR from 'swr';
import { RcLocation } from '@/lib/db/schema';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type TeamInfo = {
  name: string;
  createdAt: string;
  memberCount: number;
};

export default function GeneralSettingsPage() {
  const { data: teamInfo, isLoading: teamLoading } = useSWR<TeamInfo>(
    '/api/v1/settings/team-info',
    fetcher
  );
  const { data: locations, isLoading: locationsLoading } = useSWR<RcLocation[]>(
    '/api/v1/locations',
    fetcher
  );

  if (teamLoading || locationsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team Information */}
      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-5" />
            Organization Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Organization Name
            </label>
            <p className="text-lg font-semibold mt-1">
              {teamInfo?.name || 'Not available'}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Created
              </label>
              <p className="text-base mt-1">
                {teamInfo?.createdAt
                  ? new Date(teamInfo.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'Not available'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Team Members
              </label>
              <p className="text-base mt-1">{teamInfo?.memberCount || 0} members</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connected Locations */}
      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="size-5" />
              Connected Locations
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {locations?.length || 0} {locations?.length === 1 ? 'location' : 'locations'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {!locations || locations.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="size-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                No locations connected yet. Go to Integrations to sync your Google Business
                Profile locations.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className="p-4 rounded-xl border border-border/50 hover:border-border transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-base mb-1">{location.name}</h4>
                      {location.isVerified ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200 text-xs">
                          <CheckCircle2 className="size-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200 text-xs">
                          <XCircle className="size-3 mr-1" />
                          Not Verified
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    {location.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="size-4 mt-0.5 flex-shrink-0" />
                        <span>{location.address}</span>
                      </div>
                    )}
                    {location.phoneNumber && (
                      <div className="flex items-center gap-2">
                        <Phone className="size-4 flex-shrink-0" />
                        <span>{location.phoneNumber}</span>
                      </div>
                    )}
                    {location.websiteUrl && (
                      <div className="flex items-center gap-2">
                        <Globe className="size-4 flex-shrink-0" />
                        <a
                          href={location.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {location.websiteUrl}
                        </a>
                      </div>
                    )}
                  </div>

                  {location.lastSyncAt && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <p className="text-xs text-muted-foreground">
                        Last synced:{' '}
                        {new Date(location.lastSyncAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Information */}
      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Usage & Limits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Monthly Reply Quota</span>
              <span className="font-semibold">100 replies</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Plan</span>
              <Badge variant="secondary">Free</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
