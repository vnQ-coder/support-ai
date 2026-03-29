'use client';

import { useState, useCallback } from 'react';
import { Download, Loader2 } from 'lucide-react';

interface ExportButtonProps {
  /** Dashboard-relative API path, e.g. "/api/export/conversations" */
  endpoint: string;
  /** Filename for the downloaded CSV (without extension) */
  filename: string;
  /** Button label text */
  label?: string;
  /** Optional query params to append */
  params?: Record<string, string>;
}

/**
 * Client component that triggers a CSV download from a dashboard API route.
 * Shows loading state while the download is in progress.
 */
export function ExportButton({
  endpoint,
  filename,
  label = 'Export CSV',
  params,
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const url = new URL(endpoint, window.location.origin);
      if (params) {
        for (const [key, value] of Object.entries(params)) {
          url.searchParams.set(key, value);
        }
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const message =
          body?.error?.message ?? `Export failed (${response.status})`;
        setError(message);
        return;
      }

      // Trigger browser download
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = `${filename}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setLoading(false);
    }
  }, [endpoint, filename, params]);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleExport}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {label}
      </button>
      {error && (
        <span className="text-xs text-destructive">{error}</span>
      )}
    </div>
  );
}
