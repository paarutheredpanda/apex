import { Request, Response, NextFunction } from 'express';

const SYMBOL_RE = /^[A-Z][A-Z0-9.-]{0,9}$/;

interface YahooQuoteResult {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  currency: string;
  regularMarketTime: number;
}

interface YahooResponse {
  quoteResponse?: {
    result?: YahooQuoteResult[];
  };
}

export interface StockQuote {
  symbol: string;
  price: number;
  currency: string;
  change: number;
  changePercent: number;
  marketTime: number | null;
  source: string;
}

async function fetchYahooQuote(symbol: string): Promise<StockQuote> {
  const url = `https://query2.finance.yahoo.com/v8/finance/quote?symbols=${encodeURIComponent(symbol)}`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; APEX/1.0)',
      'Accept': 'application/json',
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    throw new Error(`Upstream error ${res.status} from Yahoo Finance`);
  }

  const data = (await res.json()) as YahooResponse;
  const result = data?.quoteResponse?.result?.[0];

  if (!result || result.regularMarketPrice === undefined) {
    throw Object.assign(new Error(`Symbol not found: ${symbol}`), { httpStatus: 404 });
  }

  return {
    symbol: result.symbol,
    price: result.regularMarketPrice,
    currency: result.currency ?? 'USD',
    change: result.regularMarketChange ?? 0,
    changePercent: result.regularMarketChangePercent ?? 0,
    marketTime: result.regularMarketTime ?? null,
    source: 'yahoo-finance',
  };
}

export const getStockQuote = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { symbol } = req.params;
    const upper = (symbol ?? '').toUpperCase();

    if (!SYMBOL_RE.test(upper)) {
      res.status(400).json({ error: 'Invalid symbol — must be 1–10 alphanumeric characters, dots, or hyphens' });
      return;
    }

    const quote = await fetchYahooQuote(upper);
    res.json(quote);
  } catch (err) {
    const e = err as Error & { httpStatus?: number };
    if (e.httpStatus === 404) {
      res.status(404).json({ error: e.message });
      return;
    }
    next(err);
  }
};
