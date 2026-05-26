import { Request, Response, NextFunction } from 'express';

const SYMBOL_RE = /^[A-Z][A-Z0-9.-]{0,9}$/;

const VALID_RANGES = ['1D', '5D', '1M', '3M', '1Y'] as const;
type HistoryRange = (typeof VALID_RANGES)[number];

const RANGE_CONFIG: Record<HistoryRange, { interval: string; range: string }> = {
  '1D': { interval: '5m',  range: '1d'  },
  '5D': { interval: '60m', range: '5d'  },
  '1M': { interval: '1d',  range: '1mo' },
  '3M': { interval: '1d',  range: '3mo' },
  '1Y': { interval: '1d',  range: '1y'  },
};

interface YahooChartMeta {
  currency?: string;
  symbol: string;
  regularMarketPrice?: number;
  regularMarketVolume?: number;
  marketState?: string;
}

interface YahooChartResult {
  meta: YahooChartMeta;
  timestamp?: number[];
  indicators?: {
    quote?: Array<{
      open?: (number | null)[];
      high?: (number | null)[];
      low?: (number | null)[];
      close?: (number | null)[];
      volume?: (number | null)[];
    }>;
  };
}

interface YahooChartResponse {
  chart?: {
    result?: YahooChartResult[];
    error?: { code: string; description: string } | null;
  };
}

export interface HistoryCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockHistory {
  symbol: string;
  currency: string;
  regularMarketPrice: number | null;
  regularMarketVolume: number | null;
  marketState: string | null;
  range: HistoryRange;
  candles: HistoryCandle[];
}

export const getStockHistory = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { symbol } = req.params;
    const upper = (symbol ?? '').toUpperCase();

    if (!SYMBOL_RE.test(upper)) {
      res.status(400).json({ error: 'Invalid symbol' });
      return;
    }

    const rawRange = ((req.query.range as string) ?? '1M').toUpperCase();
    if (!VALID_RANGES.includes(rawRange as HistoryRange)) {
      res.status(400).json({ error: `Invalid range. Must be one of: ${VALID_RANGES.join(', ')}` });
      return;
    }

    const historyRange = rawRange as HistoryRange;
    const { interval, range } = RANGE_CONFIG[historyRange];

    const url =
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(upper)}` +
      `?interval=${interval}&range=${range}`;

    const yahooRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; APEX/1.0)',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!yahooRes.ok) {
      throw new Error(`Upstream error ${yahooRes.status} from Yahoo Finance`);
    }

    const data = (await yahooRes.json()) as YahooChartResponse;

    if (data.chart?.error) {
      throw Object.assign(
        new Error(data.chart.error.description ?? 'Yahoo Finance error'),
        { httpStatus: 404 },
      );
    }

    const result = data.chart?.result?.[0];
    if (!result) {
      throw Object.assign(new Error(`Symbol not found: ${upper}`), { httpStatus: 404 });
    }

    const { meta, timestamp = [], indicators } = result;
    const quote = indicators?.quote?.[0];

    const candles: HistoryCandle[] = [];
    for (let i = 0; i < timestamp.length; i++) {
      const o = quote?.open?.[i];
      const h = quote?.high?.[i];
      const l = quote?.low?.[i];
      const c = quote?.close?.[i];
      const v = quote?.volume?.[i];
      if (o == null || h == null || l == null || c == null) continue;
      candles.push({
        time: timestamp[i],
        open: o,
        high: h,
        low: l,
        close: c,
        volume: v ?? 0,
      });
    }

    const response: StockHistory = {
      symbol: meta.symbol ?? upper,
      currency: meta.currency ?? 'USD',
      regularMarketPrice: meta.regularMarketPrice ?? null,
      regularMarketVolume: meta.regularMarketVolume ?? null,
      marketState: meta.marketState ?? null,
      range: historyRange,
      candles,
    };

    res.json(response);
  } catch (err) {
    const e = err as Error & { httpStatus?: number };
    if (e.httpStatus === 404) {
      res.status(404).json({ error: e.message });
      return;
    }
    next(err);
  }
};
