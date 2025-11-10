'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Filter, 
  Download,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';

type AuditLog = {
  id: number;
  action: string;
  entityType: string;
  entityId: number | null;
  oldValue: any;
  newValue: any;
  metadata: any;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: Date;
  userId: number | null;
  userName: string | null;
  userEmail: string | null;
};

type Pagination = {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false,
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    userId: '',
    startDate: '',
    endDate: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [pagination.offset]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
        ...(filters.action && { action: filters.action }),
        ...(filters.entityType && { entityType: filters.entityType }),
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      });

      const response = await fetch(`/api/v1/audit-logs?${params}`);
      if (!response.ok) throw new Error('Failed to fetch logs');

      const data = await response.json();
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setPagination((prev) => ({ ...prev, offset: 0 }));
    fetchLogs();
  };

  const clearFilters = () => {
    setFilters({
      action: '',
      entityType: '',
      userId: '',
      startDate: '',
      endDate: '',
    });
    setPagination((prev) => ({ ...prev, offset: 0 }));
    setTimeout(fetchLogs, 0);
  };

  const nextPage = () => {
    if (pagination.hasMore) {
      setPagination((prev) => ({
        ...prev,
        offset: prev.offset + prev.limit,
      }));
    }
  };

  const prevPage = () => {
    if (pagination.offset > 0) {
      setPagination((prev) => ({
        ...prev,
        offset: Math.max(0, prev.offset - prev.limit),
      }));
    }
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('POSTED') || action.includes('CREATED')) {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    if (action.includes('DELETED') || action.includes('FAILED')) {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    if (action.includes('UPDATED') || action.includes('EDITED')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    if (action.includes('SYNCED')) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatAction = (action: string) => {
    return action
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50/50 p-6 lg:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="size-8 text-primary" />
            <h1 className="text-4xl font-bold">Audit Log</h1>
          </div>
          <p className="text-muted-foreground">
            Complete activity history for your organization
          </p>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="size-5 text-muted-foreground" />
              <h2 className="font-semibold">Filters</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide' : 'Show'}
            </Button>
          </div>

          {showFilters && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Action
                  </label>
                  <select
                    value={filters.action}
                    onChange={(e) => handleFilterChange('action', e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    <option value="">All Actions</option>
                    <option value="DRAFT_GENERATED">Draft Generated</option>
                    <option value="REPLY_POSTED">Reply Posted</option>
                    <option value="LOCATION_SYNCED">Location Synced</option>
                    <option value="REVIEWS_SYNCED">Reviews Synced</option>
                    <option value="CONNECTION_CREATED">Connection Created</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Entity Type
                  </label>
                  <select
                    value={filters.entityType}
                    onChange={(e) => handleFilterChange('entityType', e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    <option value="">All Types</option>
                    <option value="review">Review</option>
                    <option value="draft">Draft</option>
                    <option value="reply">Reply</option>
                    <option value="location">Location</option>
                    <option value="connection">Connection</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={applyFilters}>
                  Apply Filters
                </Button>
                <Button variant="outline" onClick={clearFilters}>
                  Clear
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Logs Table */}
        <Card className="overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground">
              Loading audit logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center">
              <Activity className="size-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-xl font-semibold mb-2">No audit logs found</h3>
              <p className="text-muted-foreground">
                {Object.values(filters).some((v) => v)
                  ? 'Try adjusting your filters'
                  : 'Activity will appear here as you use the app'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-border">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Entity
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {logs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="size-4 text-muted-foreground" />
                            <span>
                              {format(new Date(log.timestamp), 'MMM d, yyyy')}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {format(new Date(log.timestamp), 'h:mm a')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getActionBadgeColor(
                              log.action
                            )}`}
                          >
                            {formatAction(log.action)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium">
                            {log.entityType}
                          </div>
                          {log.entityId && (
                            <div className="text-xs text-muted-foreground">
                              ID: {log.entityId}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {log.userName ? (
                            <div className="flex items-center gap-2">
                              <User className="size-4 text-muted-foreground" />
                              <div>
                                <div className="text-sm font-medium">
                                  {log.userName}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {log.userEmail}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              System
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {log.metadata && (
                            <div className="text-xs text-muted-foreground max-w-xs truncate">
                              {JSON.stringify(log.metadata)}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {pagination.offset + 1} to{' '}
                  {Math.min(pagination.offset + pagination.limit, pagination.total)} of{' '}
                  {pagination.total} logs
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevPage}
                    disabled={pagination.offset === 0}
                  >
                    <ChevronLeft className="size-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={nextPage}
                    disabled={!pagination.hasMore}
                  >
                    Next
                    <ChevronRight className="size-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
