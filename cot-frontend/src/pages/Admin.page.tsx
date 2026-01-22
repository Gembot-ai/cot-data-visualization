import React, { useState, useEffect } from 'react';

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

  // Fetch status on load
  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/v1/admin/status`);
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-500 mt-1">Manage COT data and validate against CFTC</p>
          </div>
          <a
            href="/"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back to Dashboard
          </a>
        </div>

        {/* Auth Section */}
        {!isAuthenticated ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Authentication Required</h2>
            <div className="flex gap-4">
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Enter admin key"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
              <button
                onClick={handleLogin}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Login
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center justify-between">
            <span className="text-green-800">Authenticated as admin</span>
            <button
              onClick={handleLogout}
              className="text-green-700 hover:text-green-900 underline"
            >
              Logout
            </button>
          </div>
        )}

        {/* Message */}
        {message && (
          <div className={`rounded-xl p-4 mb-6 ${
            message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
            message.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
            'bg-blue-50 border border-blue-200 text-blue-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Status Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Data Status</h2>
            <button
              onClick={fetchStatus}
              className="text-blue-600 hover:text-blue-800"
            >
              Refresh
            </button>
          </div>

          {status ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-900">{status.totalReports.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Total Reports</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-900">{status.markets?.length || 0}</div>
                <div className="text-sm text-gray-500">Markets</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-gray-900">
                  {status.dateRange?.latest ? new Date(status.dateRange.latest).toLocaleDateString() : 'N/A'}
                </div>
                <div className="text-sm text-gray-500">Latest Report</div>
              </div>
              <div className={`rounded-lg p-4 ${status.isUpToDate ? 'bg-green-50' : 'bg-yellow-50'}`}>
                <div className={`text-2xl font-bold ${status.isUpToDate ? 'text-green-600' : 'text-yellow-600'}`}>
                  {status.isUpToDate ? 'Up to Date' : 'Behind'}
                </div>
                <div className="text-sm text-gray-500">
                  CFTC Latest: {status.cftcLatestAvailable || 'Unknown'}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">Loading status...</div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={handleValidate}
              disabled={!isAuthenticated || loading !== null}
              className={`p-4 rounded-xl border-2 transition-all ${
                isAuthenticated && !loading
                  ? 'border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800'
                  : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <div className="text-xl font-bold mb-1">
                {loading === 'validate' ? 'Validating...' : 'Validate Data'}
              </div>
              <div className="text-sm opacity-75">
                Compare database against CFTC API
              </div>
            </button>

            <button
              onClick={handleUpdate}
              disabled={!isAuthenticated || loading !== null}
              className={`p-4 rounded-xl border-2 transition-all ${
                isAuthenticated && !loading
                  ? 'border-green-200 bg-green-50 hover:bg-green-100 text-green-800'
                  : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <div className="text-xl font-bold mb-1">
                {loading === 'update' ? 'Starting...' : 'Update Data'}
              </div>
              <div className="text-sm opacity-75">
                Fetch latest reports from CFTC
              </div>
            </button>

            <button
              onClick={handleRefetch}
              disabled={!isAuthenticated || loading !== null}
              className={`p-4 rounded-xl border-2 transition-all ${
                isAuthenticated && !loading
                  ? 'border-red-200 bg-red-50 hover:bg-red-100 text-red-800'
                  : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <div className="text-xl font-bold mb-1">
                {loading === 'refetch' ? 'Starting...' : 'Full Refetch'}
              </div>
              <div className="text-sm opacity-75">
                Clear all data and re-fetch (fixes incorrect data)
              </div>
            </button>
          </div>
        </div>

        {/* Validation Results */}
        {validationResult && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Validation Results</h2>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{validationResult.summary.validated}</div>
                <div className="text-sm text-green-700">Validated</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{validationResult.summary.errors}</div>
                <div className="text-sm text-red-700">Errors</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-600">{validationResult.summary.skipped}</div>
                <div className="text-sm text-gray-700">Skipped</div>
              </div>
            </div>

            {validationResult.validated.length > 0 && (
              <div className="mb-4">
                <h3 className="font-medium text-green-700 mb-2">Validated Markets:</h3>
                <div className="flex flex-wrap gap-2">
                  {validationResult.validated.map(symbol => (
                    <span key={symbol} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      {symbol}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {validationResult.errors.length > 0 && (
              <div>
                <h3 className="font-medium text-red-700 mb-2">Errors Found:</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-red-50">
                        <th className="px-4 py-2 text-left">Symbol</th>
                        <th className="px-4 py-2 text-left">Field</th>
                        <th className="px-4 py-2 text-right">Our Value</th>
                        <th className="px-4 py-2 text-right">CFTC Value</th>
                        <th className="px-4 py-2 text-right">Diff %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validationResult.errors.map((err, i) => (
                        <tr key={i} className="border-t border-red-100">
                          <td className="px-4 py-2 font-medium">{err.symbol}</td>
                          <td className="px-4 py-2">{err.field}</td>
                          <td className="px-4 py-2 text-right font-mono">{err.ourValue.toLocaleString()}</td>
                          <td className="px-4 py-2 text-right font-mono">{err.cftcValue.toLocaleString()}</td>
                          <td className="px-4 py-2 text-right text-red-600">{err.percentDiff}%</td>
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Markets Data</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">Symbol</th>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-right">Reports</th>
                    <th className="px-4 py-2 text-right">Latest Report</th>
                    <th className="px-4 py-2 text-right">Open Interest</th>
                  </tr>
                </thead>
                <tbody>
                  {status.markets.map((market) => (
                    <tr key={market.symbol} className="border-t border-gray-100">
                      <td className="px-4 py-2 font-medium">{market.symbol}</td>
                      <td className="px-4 py-2 text-gray-600">{market.name}</td>
                      <td className="px-4 py-2 text-right">{market.report_count}</td>
                      <td className="px-4 py-2 text-right">
                        {new Date(market.latest_report).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 text-right font-mono">
                        {Number(market.latest_oi).toLocaleString()}
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
