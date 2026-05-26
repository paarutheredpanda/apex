'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { ApexShell, SectionLabel } from '../../../../components/apex-dashboard';
import { StockChart, type ChartCandle } from './stock-chart';

type Range = '1D' | '5D' | '1M' | '3M' | '1Y';
const RANGES: Range[] = ['1D', '5D', '1M', '3M', '1Y'];

interface StockQuote {
  symbol: string;
  name: string | null;
  price: number;
  currency: string;
  change: number;
  changePercent: number;
  marketTime: number | null;
}

interface StockHistory {
  symbol: string;
  currency: string;
  regularMarketPrice: number | null;
  regularMarketVolume: number | null;
  marketState: string | null;
  range: Range;
  candles: ChartCandle[];
}

function formatCurrency(price: number, currency: string): string {
  const sym = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '';
  return `${sym || `${currency} `}${price.toFixed(2)}`;
}

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toString();
}

function MarketStateBadge({ state }: { state: string | null }) {
  if (!state) return null;
  const isOpen = state === 'REGULAR';
  const isPre = state === 'PRE';
  const isPost = state === 'POST';
  const color = isOpen ? '#3fb96e' : isPre || isPost ? '#f0a500' : '#4a5878';
  const label = isOpen ? 'OPEN' : isPre ? 'PRE-MARKET' : isPost ? 'AFTER-HOURS' : 'CLOSED';
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.12em',
        color,
        border: `1px solid ${color}44`,
        background: `${color}10`,
        padding: '3px 8px',
      }}
    >
      {label}
    </span>
  );
}

export default function StockDetailPage() {
  const params = useParams<{ id: string; symbol: string }>();
  const projectId = params.id ?? '';
  const symbol = (params.symbol ?? '').toUpperCase();

  const { user } = useUser();
  const userLabel = user?.primaryEmailAddress?.emailAddress ?? user?.username ?? null;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const [range, setRange] = useState<Range>('1M');

  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const [history, setHistory] = useState<StockHistory | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const parseError = (d: unknown, fallback: string): string => {
    if (d && typeof d === 'object' && 'error' in d && typeof (d as Record<string, unknown>).error === 'string') {
      return (d as { error: string }).error;
    }
    return fallback;
  };

  useEffect(() => {
    if (!symbol || !apiUrl) return;
    let alive = true;

    async function fetchQuote() {
      try {
        const res = await fetch(`${apiUrl}/stocks/quote/${symbol}`);
        const data = await res.json() as unknown;
        if (!alive) return;
        if (res.ok) {
          setQuote(data as StockQuote);
        } else {
          setQuoteError(parseError(data, `Failed to load quote (${res.status})`));
        }
      } catch {
        if (alive) setQuoteError('Network error fetching quote');
      }
    }

    fetchQuote();
    return () => { alive = false; };
  }, [symbol, apiUrl]);

  const loadHistory = useCallback(
    async (sym: string, r: Range) => {
      if (!apiUrl) return;
      setHistoryLoading(true);
      setHistoryError(null);

      try {
        const res = await fetch(`${apiUrl}/stocks/history/${sym}?range=${r}`);
        const data = await res.json() as unknown;
        if (res.ok) {
          setHistory(data as StockHistory);
        } else {
          setHistoryError(parseError(data, `Failed to load chart data (${res.status})`));
        }
      } catch {
        setHistoryError('Network error fetching chart data');
      } finally {
        setHistoryLoading(false);
      }
    },
    [apiUrl],
  );

  useEffect(() => {
    if (symbol) loadHistory(symbol, range);
  }, [symbol, range, loadHistory]);

  const changeColor = quote && quote.change >= 0 ? '#3fb96e' : '#f87171';
  const changeSign = quote && quote.change > 0 ? '+' : '';

  return (
    <ApexShell
      title={symbol}
      eyebrow="STOCK DETAIL"
      userLabel={userLabel}
      apiUrl={apiUrl}
      rightRail={
        <Link
          href={`/projects/${projectId}`}
          style={{
            color: 'var(--muted)',
            border: '1px solid var(--border)',
            padding: '8px 12px',
            fontSize: 10,
            letterSpacing: '0.12em',
            textDecoration: 'none',
          }}
        >
          ← PROJECT
        </Link>
      }
    >
      {/* Quote header */}
      <div style={{ marginBottom: 32 }}>
        {quote?.name && (
          <div style={{ color: 'var(--muted)', fontSize: 12, letterSpacing: '0.06em', marginBottom: 8 }}>
            {quote.name}
          </div>
        )}
        {quoteError && (
          <div style={{ color: '#f87171', fontSize: 12, marginBottom: 8 }}>{quoteError}</div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          {quote ? (
            <>
              <span
                style={{
                  fontFamily: 'var(--font-ibm), monospace',
                  fontSize: 'clamp(28px, 5vw, 44px)',
                  fontWeight: 600,
                  color: 'var(--text)',
                  letterSpacing: '-0.02em',
                }}
              >
                {formatCurrency(quote.price, quote.currency)}
              </span>
              <div>
                <div style={{ color: changeColor, fontFamily: 'var(--font-ibm), monospace', fontSize: 16, fontWeight: 500 }}>
                  {changeSign}{quote.change.toFixed(2)}
                </div>
                <div style={{ color: changeColor, fontFamily: 'var(--font-ibm), monospace', fontSize: 13 }}>
                  {changeSign}{quote.changePercent.toFixed(2)}%
                </div>
              </div>
              <MarketStateBadge state={history?.marketState ?? null} />
            </>
          ) : !quoteError ? (
            <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-ibm), monospace', fontSize: 20, letterSpacing: '0.1em' }}>
              ···
            </span>
          ) : null}
        </div>
      </div>

      <SectionLabel text="PRICE CHART" />

      {/* Range selector */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {RANGES.map((r) => {
          const active = r === range;
          return (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              style={{
                padding: '5px 12px',
                background: active ? 'var(--amber)' : 'transparent',
                border: `1px solid ${active ? 'var(--amber)' : 'var(--border)'}`,
                color: active ? 'var(--ink)' : 'var(--muted)',
                fontFamily: 'inherit',
                fontSize: 10,
                fontWeight: active ? 700 : 400,
                letterSpacing: '0.12em',
                cursor: 'pointer',
              }}
            >
              {r}
            </button>
          );
        })}
      </div>

      {/* Chart area */}
      <div
        style={{
          border: '1px solid var(--border)',
          background: 'linear-gradient(180deg, rgba(13,18,25,0.9) 0%, rgba(8,12,16,0.95) 100%)',
          padding: '16px 12px 8px',
          marginBottom: 24,
          minHeight: 312,
          display: 'flex',
          alignItems: historyLoading || historyError || !history?.candles.length ? 'center' : 'stretch',
          justifyContent: historyLoading || historyError || !history?.candles.length ? 'center' : 'stretch',
        }}
      >
        {historyLoading && (
          <span style={{ color: 'var(--muted)', fontSize: 11, letterSpacing: '0.1em' }}>
            LOADING CHART DATA...
          </span>
        )}
        {!historyLoading && historyError && (
          <span style={{ color: '#f87171', fontSize: 11 }}>{historyError}</span>
        )}
        {!historyLoading && !historyError && history && history.candles.length === 0 && (
          <span style={{ color: 'var(--muted)', fontSize: 11 }}>No chart data available for this range.</span>
        )}
        {!historyLoading && !historyError && history && history.candles.length > 0 && (
          <div style={{ width: '100%' }}>
            <StockChart candles={history.candles} change={quote?.change ?? 0} />
          </div>
        )}
      </div>

      {/* Stats row */}
      {history && (
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          {history.regularMarketVolume != null && (
            <Stat label="VOLUME" value={formatVolume(history.regularMarketVolume)} />
          )}
          <Stat label="RANGE" value={range} />
          <Stat label="CURRENCY" value={history.currency} />
          <Stat label="SOURCE" value="YAHOO FINANCE" />
        </div>
      )}
    </ApexShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.14em', marginBottom: 4 }}>{label}</div>
      <div style={{ color: 'var(--text)', fontFamily: 'var(--font-ibm), monospace', fontSize: 13 }}>{value}</div>
    </div>
  );
}
