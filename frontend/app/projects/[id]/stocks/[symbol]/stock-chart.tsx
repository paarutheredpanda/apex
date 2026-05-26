'use client';

import { useEffect, useRef } from 'react';
import type { IChartApi, UTCTimestamp } from 'lightweight-charts';

export interface ChartCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface StockChartProps {
  candles: ChartCandle[];
  change: number;
}

export function StockChart({ candles, change }: StockChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || candles.length === 0) return;

    const container = containerRef.current;
    let chart: IChartApi | null = null;
    let observer: ResizeObserver | null = null;
    let cancelled = false;

    import('lightweight-charts').then(({ createChart, ColorType, CrosshairMode, AreaSeries }) => {
      if (cancelled || !container) return;

      const positive = change >= 0;
      const lineColor = positive ? '#3fb96e' : '#f87171';
      const topColor = positive ? 'rgba(63,185,110,0.15)' : 'rgba(248,113,113,0.15)';

      chart = createChart(container, {
        width: container.clientWidth,
        height: 280,
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: '#4a5878',
          fontSize: 11,
          fontFamily: '"IBM Plex Mono", monospace',
        },
        grid: {
          vertLines: { color: '#1a2233' },
          horzLines: { color: '#1a2233' },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: { color: '#4a5878', style: 2, width: 1 },
          horzLine: { color: '#4a5878', style: 2, width: 1 },
        },
        timeScale: {
          borderColor: '#1a2233',
          timeVisible: true,
          secondsVisible: false,
        },
        rightPriceScale: {
          borderColor: '#1a2233',
        },
      });

      const series = chart.addSeries(AreaSeries, {
        lineColor,
        topColor,
        bottomColor: 'rgba(0,0,0,0)',
        lineWidth: 2,
        crosshairMarkerRadius: 4,
        crosshairMarkerBorderColor: lineColor,
        crosshairMarkerBackgroundColor: '#080c10',
        lastValueVisible: true,
        priceLineVisible: false,
      });

      series.setData(
        candles.map((c) => ({
          time: c.time as UTCTimestamp,
          value: c.close,
        })),
      );

      chart.timeScale().fitContent();

      observer = new ResizeObserver(() => {
        chart?.applyOptions({ width: container.clientWidth });
      });
      observer.observe(container);
    });

    return () => {
      cancelled = true;
      observer?.disconnect();
      chart?.remove();
    };
  }, [candles, change]);

  return <div ref={containerRef} style={{ width: '100%', height: 280 }} />;
}
