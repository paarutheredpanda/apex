'use client';

import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';

interface WatchlistItem {
  id: string;
  projectId: string;
  userId: string;
  symbol: string;
  name: string | null;
  createdAt: string;
}

interface WatchlistPanelProps {
  apiUrl: string | undefined;
  getToken: () => Promise<string | null>;
  projectId: string;
}

type QuoteState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; price: number; currency: string; change: number; changePercent: number; marketTime: number | null }
  | { status: 'error'; message: string };

type QuoteMap = Record<string, QuoteState>;

const SYMBOL_PATTERN = /^[A-Z][A-Z0-9.-]{0,9}$/;

function parseApiError(data: unknown, fallback: string): string {
  if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') {
    return data.error;
  }
  return fallback;
}

function formatCurrency(price: number, currency: string): string {
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '';
  const prefix = symbol || `${currency} `;
  return `${prefix}${price.toFixed(2)}`;
}

function QuoteCell({ state }: { state: QuoteState | undefined }) {
  if (!state || state.status === 'idle') {
    return <div style={{ minWidth: 80 }} />;
  }

  if (state.status === 'loading') {
    return (
      <div style={{ textAlign: 'right', minWidth: 80 }}>
        <span style={{ color: 'var(--muted)', fontSize: 13, fontFamily: 'var(--font-ibm), monospace', letterSpacing: '0.1em' }}>
          ···
        </span>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div style={{ textAlign: 'right', minWidth: 80 }}>
        <span style={{ color: '#f87171', fontSize: 10, letterSpacing: '0.08em' }} title={state.message}>
          N/A
        </span>
      </div>
    );
  }

  const { price, currency, change, changePercent } = state;
  const changeColor = change > 0 ? '#3fb96e' : change < 0 ? '#f87171' : 'var(--muted)';
  const changeSign = change > 0 ? '+' : '';

  return (
    <div style={{ textAlign: 'right', minWidth: 80 }}>
      <div
        style={{
          color: 'var(--text)',
          fontFamily: 'var(--font-ibm), monospace',
          fontSize: 14,
          fontWeight: 500,
          letterSpacing: '-0.01em',
        }}
      >
        {formatCurrency(price, currency)}
      </div>
      <div
        style={{
          color: changeColor,
          fontSize: 11,
          fontFamily: 'var(--font-ibm), monospace',
          letterSpacing: '0.02em',
        }}
      >
        {changeSign}{changePercent.toFixed(2)}%
      </div>
    </div>
  );
}

export function WatchlistPanel({ apiUrl, getToken, projectId }: WatchlistPanelProps) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [quotes, setQuotes] = useState<QuoteMap>({});
  const [refreshing, setRefreshing] = useState(false);

  const normalizedSymbol = useMemo(() => symbol.trim().toUpperCase(), [symbol]);
  const canSubmit = SYMBOL_PATTERN.test(normalizedSymbol) && !submitting;

  async function fetchQuote(sym: string): Promise<void> {
    setQuotes((prev) => ({ ...prev, [sym]: { status: 'loading' } }));
    try {
      const res = await fetch(`${apiUrl}/stocks/quote/${sym}`);
      const d = await res.json() as Record<string, unknown>;
      setQuotes((prev) => ({
        ...prev,
        [sym]: res.ok
          ? {
              status: 'ok',
              price: d.price as number,
              currency: d.currency as string,
              change: d.change as number,
              changePercent: d.changePercent as number,
              marketTime: d.marketTime as number | null,
            }
          : { status: 'error', message: parseApiError(d, 'Failed to fetch quote') },
      }));
    } catch {
      setQuotes((prev) => ({ ...prev, [sym]: { status: 'error', message: 'Network error' } }));
    }
  }

  async function fetchQuotesForSymbols(symbols: string[]): Promise<void> {
    if (symbols.length === 0) return;
    await Promise.allSettled(symbols.map(fetchQuote));
  }

  async function handleRefresh() {
    if (refreshing || items.length === 0) return;
    setRefreshing(true);
    await fetchQuotesForSymbols(items.map((i) => i.symbol));
    setRefreshing(false);
  }

  useEffect(() => {
    let alive = true;

    async function loadWatchlist() {
      setLoading(true);
      setError(null);

      try {
        const token = await getToken();
        const res = await fetch(`${apiUrl}/projects/${projectId}/watchlist`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        let data: unknown = null;
        try {
          data = await res.json();
        } catch {
          data = null;
        }

        if (!alive) return;

        if (!res.ok) {
          setItems([]);
          setError(parseApiError(data, `Failed to load watchlist (${res.status})`));
          return;
        }

        if (Array.isArray(data)) {
          const loaded = data as WatchlistItem[];
          setItems(loaded);
          if (loaded.length > 0) {
            void fetchQuotesForSymbols(loaded.map((i) => i.symbol));
          }
        } else {
          setItems([]);
          setError('Unexpected response from watchlist API.');
        }
      } catch {
        if (alive) {
          setItems([]);
          setError('Cannot reach backend at ' + apiUrl);
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    loadWatchlist();

    return () => {
      alive = false;
    };
  }, [apiUrl, getToken, projectId]);

  async function addSymbol(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      setError('Enter a valid symbol using letters, numbers, dots, or hyphens.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const token = await getToken();
      const res = await fetch(`${apiUrl}/projects/${projectId}/watchlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ symbol: normalizedSymbol }),
      });

      let data: unknown = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        setError(parseApiError(data, `Failed to add symbol (${res.status})`));
        return;
      }

      const newItem = data as WatchlistItem;
      setItems((prev) => [newItem, ...prev]);
      setSymbol('');
      void fetchQuote(newItem.symbol);
    } catch {
      setError('Network error while adding symbol.');
    } finally {
      setSubmitting(false);
    }
  }

  async function removeItem(itemId: string) {
    setRemovingId(itemId);
    setError(null);

    try {
      const token = await getToken();
      const res = await fetch(`${apiUrl}/projects/${projectId}/watchlist/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok && res.status !== 404) {
        let data: unknown = null;
        try {
          data = await res.json();
        } catch {
          data = null;
        }
        setError(parseApiError(data, `Failed to remove symbol (${res.status})`));
        return;
      }

      setItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch {
      setError('Network error while removing symbol.');
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div>
      <form onSubmit={addSymbol} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 10 }}>
        <input
          aria-label="Stock symbol"
          value={symbol}
          onChange={(event) => setSymbol(event.target.value.toUpperCase())}
          placeholder="AAPL"
          maxLength={10}
          style={{
            minWidth: 0,
            padding: '10px 12px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            fontFamily: 'inherit',
            fontSize: 13,
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={!canSubmit}
          style={{
            padding: '10px 14px',
            background: canSubmit ? 'var(--green)' : 'var(--surface-2)',
            color: canSubmit ? 'var(--ink)' : 'var(--muted)',
            border: 'none',
            fontFamily: 'inherit',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.12em',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            whiteSpace: 'nowrap',
          }}
        >
          {submitting ? 'ADDING...' : 'ADD'}
        </button>
      </form>

      {loading && (
        <div style={{ padding: '22px 0 0', color: 'var(--muted)', fontSize: 11, letterSpacing: '0.1em' }}>
          LOADING WATCHLIST...
        </div>
      )}

      {error && (
        <div style={{ marginTop: 14, padding: '10px 12px', border: '1px solid #7f1d1d', background: '#160808', color: '#f87171', fontSize: 11 }}>
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div style={{ padding: '22px 0 0', color: 'var(--muted)', fontSize: 12 }}>
          No symbols added yet.
        </div>
      )}

      {items.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                background: 'none',
                border: '1px solid var(--border)',
                color: 'var(--muted)',
                fontFamily: 'inherit',
                fontSize: 10,
                letterSpacing: '0.12em',
                padding: '4px 10px',
                cursor: refreshing ? 'not-allowed' : 'pointer',
              }}
            >
              {refreshing ? 'REFRESHING...' : '↻ REFRESH'}
            </button>
          </div>

          <div style={{ borderTop: '1px solid var(--border)' }}>
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) auto auto',
                  gap: 12,
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <Link
                    href={`/projects/${projectId}/stocks/${item.symbol}`}
                    style={{
                      color: 'var(--text)',
                      fontFamily: 'var(--font-syne), sans-serif',
                      fontSize: 17,
                      fontWeight: 750,
                      textDecoration: 'none',
                    }}
                  >
                    {item.symbol}
                  </Link>
                  {item.name && (
                    <div style={{ color: 'var(--muted)', fontSize: 11, overflowWrap: 'anywhere' }}>
                      {item.name}
                    </div>
                  )}
                </div>

                <QuoteCell state={quotes[item.symbol]} />

                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  disabled={removingId === item.id}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    color: removingId === item.id ? 'var(--muted)' : '#f87171',
                    fontFamily: 'inherit',
                    fontSize: 10,
                    letterSpacing: '0.12em',
                    padding: '7px 9px',
                    cursor: removingId === item.id ? 'not-allowed' : 'pointer',
                  }}
                >
                  {removingId === item.id ? '...' : 'REMOVE'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
