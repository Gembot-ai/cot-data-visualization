import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Download,
  Info,
  LogOut,
  Moon,
  RefreshCw,
  Search,
  ShieldCheck,
  Sun,
  Trash2,
} from 'lucide-react';
import { useTheme } from '../lib/theme';
import { useAuth } from '../lib/auth';
import { logger } from '../lib/logger';
import { formatDate, formatNumber } from '../lib/format';

interface DataStatus {
  totalReports: number;
  dateRange: {
    earliest: string;
    latest: string;
  };
  cftcLatestAvailable: string | null;
  isUpToDate: boolean;
  markets: Array<{
    symbol: string;
    name: string;
    report_count: number;
    latest_report: string;
    latest_oi: number;
  }>;
}

interface ValidationResult {
  success: boolean;
  summary: {
    validated: number;
    errors: number;
    skipped: number;
  };
  validated: string[];
  errors: Array<{
    symbol: string;
    cftcCode: string;
    reportDate: string;
    field: string;
    ourValue: number;
    cftcValue: number;
    difference: number;
    percentDiff: number;
  }>;
  skipped: string[];
}

export const AdminPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  // eccuity admins (ADMIN feature flag) are authorized via their session cookie
  // and don't need the ADMIN_KEY. isAdmin comes from /auth/me.
  const { user } = useAuth();
  const isEccuityAdmin = !!user?.isAdmin;
  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [status, setStatus] = useState<DataStatus | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL || '';

  // Check for stored admin key
  useEffect(() => {
    const storedKey = sessionStorage.getItem('adminKey');
    if (storedKey) {
      setAdminKey(storedKey);
      setIsAuthenticated(true);
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/api/v1/admin/status`);
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      logger.error('Failed to fetch status:', error);
    }
  }, [apiUrl]);

  // Fetch status on load
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleLogin = () => {
    if (adminKey.trim()) {
      sessionStorage.setItem('adminKey', adminKey);
      setIsAuthenticated(true);
      setMessage({ type: 'success', text: 'Admin key saved for this session' });
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminKey');
    setAdminKey('');
    setIsAuthenticated(false);
    setMessage(null);
  };

  const makeAuthRequest = async (endpoint: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      'x-admin-key': adminKey,
    };

    // Only set Content-Type if there's a body
    if (options.body) {
      headers['Content-Type'] = 'application/json';
    }

    return fetch(`${apiUrl}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        ...headers,
      },
    });
  };

  const handleValidate = async () => {
    setLoading('validate');
    setMessage({ type: 'info', text: 'Validating data against CFTC API... This may take a minute.' });
    setValidationResult(null);

    try {
      const response = await makeAuthRequest('/api/v1/admin/validate', { method: 'POST' });

      if (response.status === 401) {
        setMessage({ type: 'error', text: 'Invalid admin key. Check that ADMIN_KEY is set in Railway env vars.' });
        return;
      }

      if (response.status === 403) {
        setMessage({ type: 'error', text: 'Admin endpoints not configured. Set ADMIN_KEY in Railway env vars.' });
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setValidationResult(data);
        setMessage({
          type: data.success ? 'success' : 'error',
          text: data.success
            ? `Validation passed! ${data.summary.validated} markets validated.`
            : `Validation found ${data.summary.errors} errors in ${data.errors.length} markets.`
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        setMessage({ type: 'error', text: `Validation failed: ${errorData.message || errorData.error || response.statusText}` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Error running validation: ${error instanceof Error ? error.message : 'Network error'}` });
    } finally {
      setLoading(null);
    }
  };

  const handleUpdate = async () => {
    setLoading('update');
    setMessage({ type: 'info', text: 'Starting incremental update...' });

    try {
      const response = await makeAuthRequest('/api/v1/admin/update', { method: 'POST' });

      if (response.status === 401) {
        setMessage({ type: 'error', text: 'Invalid admin key. Check that ADMIN_KEY is set in Railway env vars.' });
        return;
      }

      if (response.status === 403) {
        setMessage({ type: 'error', text: 'Admin endpoints not configured. Set ADMIN_KEY in Railway env vars.' });
        return;
      }

      if (response.ok) {
        setMessage({ type: 'success', text: 'Update started in background. Check status in a few minutes.' });
        // Refresh status after a delay
        setTimeout(fetchStatus, 5000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setMessage({ type: 'error', text: `Failed to start update: ${errorData.message || errorData.error || response.statusText}` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Error triggering update: ${error instanceof Error ? error.message : 'Network error'}` });
    } finally {
      setLoading(null);
    }
  };

  const handleRefetch = async () => {
    if (!confirm('This will DELETE all existing data and re-fetch everything from CFTC. This takes several minutes. Continue?')) {
      return;
    }

    setLoading('refetch');
    setMessage({ type: 'info', text: 'Starting full refetch... This will take several minutes.' });

    try {
      const response = await makeAuthRequest('/api/v1/admin/refetch?background=true', { method: 'POST' });

      if (response.status === 401) {
        setMessage({ type: 'error', text: 'Invalid admin key. Check that ADMIN_KEY is set in Railway env vars.' });
        return;
      }

      if (response.status === 403) {
        setMessage({ type: 'error', text: 'Admin endpoints not configured. Set ADMIN_KEY in Railway env vars.' });
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setMessage({ type: 'success', text: `Refetch started in background. ${data.message || 'Check status periodically.'}` });
      } else {
        const errorData = await response.json().catch(() => ({}));
        setMessage({ type: 'error', text: `Failed to start refetch: ${errorData.message || errorData.error || response.statusText}` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Error triggering refetch: ${error instanceof Error ? error.message : 'Network error'}` });
    } finally {
      setLoading(null);
    }
  };

  const authed = isEccuityAdmin || isAuthenticated;
  const actionEnabled = authed && loading === null;
  const actionClass = (variant: 'primary' | 'secondary' | 'destructive') => {
    if (!actionEnabled) {
      return 'border border-subtle-border bg-muted/40 text-muted-foreground cursor-not-allowed';
    }
    if (variant === 'primary') return 'bg-primary text-primary-foreground hover:bg-primary/90';
    if (variant === 'destructive') return 'bg-destructive text-destructive-foreground hover:bg-destructive/90';
    return 'border border-subtle-border bg-card text-foreground hover:bg-muted/40';
  };

  return (
    <div className="min-h-screen bg-surface text-foreground p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-muted-foreground mt-1">Manage COT data and validate against CFTC</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="inline-flex items-center justify-center h-11 w-11 rounded-md border border-subtle-border bg-card text-foreground hover:bg-muted/40 transition-colors"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <a
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-subtle-border bg-card text-foreground hover:bg-muted/40 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </a>
          </div>
        </div>

        {/* Auth Section */}
        {!authed ? (
          <div className="rounded-xl border border-subtle-border bg-card shadow-gem p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Authentication Required</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Log in with an eccuity admin account from the dashboard, or enter the admin key below.
            </p>
            <div className="flex gap-4">
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Enter admin key"
                className="flex-1 px-4 py-2 rounded-md border border-subtle-border bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
              <button
                onClick={handleLogin}
                className="px-6 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                Login
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-subtle-border bg-card p-4 mb-6 flex items-center justify-between">
            <span className="flex items-center gap-2 text-foreground">
              <ShieldCheck className="h-5 w-5 text-chart-1" />
              {isEccuityAdmin
                ? `Authenticated as eccuity admin${user?.email ? ` (${user.email})` : ''}`
                : 'Authenticated as admin'}
            </span>
            {!isEccuityAdmin && (
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            )}
          </div>
        )}

        {/* Message */}
        {message && (
          <div className={`rounded-xl border p-4 mb-6 flex items-center gap-2 ${
            message.type === 'success' ? 'border-subtle-border bg-card text-foreground' :
            message.type === 'error' ? 'border-destructive/30 bg-destructive/10 text-foreground' :
            'border-subtle-border bg-muted/40 text-foreground'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-chart-1 flex-shrink-0" /> :
             message.type === 'error' ? <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" /> :
             <Info className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Status Panel */}
        <div className="rounded-xl border border-subtle-border bg-card shadow-gem p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Data Status</h2>
            <button
              onClick={fetchStatus}
              className="inline-flex items-center gap-1.5 text-sm rounded-md border border-subtle-border bg-card px-3 py-1.5 text-foreground hover:bg-muted/40 transition-colors"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>

          {status ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-lg border border-subtle-border bg-card-muted p-4">
                <div className="text-2xl font-bold text-foreground">{formatNumber(status.totalReports)}</div>
                <div className="text-sm text-muted-foreground">Total Reports</div>
              </div>
              <div className="rounded-lg border border-subtle-border bg-card-muted p-4">
                <div className="text-2xl font-bold text-foreground">{status.markets?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Markets</div>
              </div>
              <div className="rounded-lg border border-subtle-border bg-card-muted p-4">
                <div className="text-2xl font-bold text-foreground">
                  {status.dateRange?.latest ? formatDate(status.dateRange.latest) : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">Latest Report</div>
              </div>
              <div className="rounded-lg border border-subtle-border bg-card-muted p-4">
                <div className={`text-2xl font-bold ${status.isUpToDate ? 'text-chart-1' : 'text-chart-5'}`}>
                  {status.isUpToDate ? 'Up to Date' : 'Behind'}
                </div>
                <div className="text-sm text-muted-foreground">
                  CFTC Latest: {status.cftcLatestAvailable || 'Unknown'}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground">Loading status...</div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="rounded-xl border border-subtle-border bg-card shadow-gem p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={handleValidate}
              disabled={!actionEnabled}
              className={`p-4 rounded-xl text-left transition-colors ${actionClass('secondary')}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Search className="h-5 w-5" />
                <span className="text-lg font-bold">
                  {loading === 'validate' ? 'Validating...' : 'Validate Data'}
                </span>
              </div>
              <div className="text-sm opacity-80">
                Compare database against CFTC API
              </div>
            </button>

            <button
              onClick={handleUpdate}
              disabled={!actionEnabled}
              className={`p-4 rounded-xl text-left transition-colors ${actionClass('primary')}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Download className="h-5 w-5" />
                <span className="text-lg font-bold">
                  {loading === 'update' ? 'Starting...' : 'Update Data'}
                </span>
              </div>
              <div className="text-sm opacity-80">
                Fetch latest reports from CFTC
              </div>
            </button>

            <button
              onClick={handleRefetch}
              disabled={!actionEnabled}
              className={`p-4 rounded-xl text-left transition-colors ${actionClass('destructive')}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Trash2 className="h-5 w-5" />
                <span className="text-lg font-bold">
                  {loading === 'refetch' ? 'Starting...' : 'Full Refetch'}
                </span>
              </div>
              <div className="text-sm opacity-80">
                Clear all data and re-fetch (fixes incorrect data)
              </div>
            </button>
          </div>
        </div>

        {/* Validation Results */}
        {validationResult && (
          <div className="rounded-xl border border-subtle-border bg-card shadow-gem p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Validation Results</h2>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="rounded-lg border border-subtle-border bg-card-muted p-4 text-center">
                <div className="text-2xl font-bold text-chart-1">{validationResult.summary.validated}</div>
                <div className="text-sm text-muted-foreground">Validated</div>
              </div>
              <div className="rounded-lg border border-subtle-border bg-card-muted p-4 text-center">
                <div className="text-2xl font-bold text-destructive">{validationResult.summary.errors}</div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </div>
              <div className="rounded-lg border border-subtle-border bg-card-muted p-4 text-center">
                <div className="text-2xl font-bold text-muted-foreground">{validationResult.summary.skipped}</div>
                <div className="text-sm text-muted-foreground">Skipped</div>
              </div>
            </div>

            {validationResult.validated.length > 0 && (
              <div className="mb-4">
                <h3 className="font-medium text-foreground mb-2">Validated Markets:</h3>
                <div className="flex flex-wrap gap-2">
                  {validationResult.validated.map(symbol => (
                    <span key={symbol} className="rounded-full border border-subtle-border bg-card-muted px-3 py-1 text-sm text-foreground">
                      {symbol}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {validationResult.errors.length > 0 && (
              <div>
                <h3 className="font-medium text-foreground mb-2">Errors Found:</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        <th className="px-4 py-2 text-left">Symbol</th>
                        <th className="px-4 py-2 text-left">Field</th>
                        <th className="px-4 py-2 text-right">Our Value</th>
                        <th className="px-4 py-2 text-right">CFTC Value</th>
                        <th className="px-4 py-2 text-right">Diff %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validationResult.errors.map((err, i) => (
                        <tr key={i} className="border-b border-subtle-border text-foreground hover:bg-muted/40">
                          <td className="px-4 py-2 font-medium">{err.symbol}</td>
                          <td className="px-4 py-2">{err.field}</td>
                          <td className="px-4 py-2 text-right font-mono">{formatNumber(err.ourValue)}</td>
                          <td className="px-4 py-2 text-right font-mono">{formatNumber(err.cftcValue)}</td>
                          <td className="px-4 py-2 text-right text-destructive">{err.percentDiff}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Markets Table */}
        {status?.markets && status.markets.length > 0 && (
          <div className="rounded-xl border border-subtle-border bg-card shadow-gem p-6">
            <h2 className="text-lg font-semibold mb-4">Markets Data</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2 text-left">Symbol</th>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-right">Reports</th>
                    <th className="px-4 py-2 text-right">Latest Report</th>
                    <th className="px-4 py-2 text-right">Open Interest</th>
                  </tr>
                </thead>
                <tbody>
                  {status.markets.map((market) => (
                    <tr key={market.symbol} className="border-b border-subtle-border text-foreground hover:bg-muted/40">
                      <td className="px-4 py-2 font-medium">{market.symbol}</td>
                      <td className="px-4 py-2 text-muted-foreground">{market.name}</td>
                      <td className="px-4 py-2 text-right">{market.report_count}</td>
                      <td className="px-4 py-2 text-right">
                        {formatDate(market.latest_report)}
                      </td>
                      <td className="px-4 py-2 text-right font-mono">
                        {formatNumber(market.latest_oi)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
