'use client';

import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Minus, BarChart3, Clock, MessageSquare, DollarSign, Target } from 'lucide-react';
import { Card } from '@/design/components/Card';
import { Skeleton } from '@/design/components/Skeleton';
import { t } from '@/design/i18n';
import type { MetricData } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface MetricsTabProps {
  agentId: string;
  token: string;
}

function Sparkline({ data, width = 80, height = 24 }: { data: number[]; width?: number; height?: number }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke="var(--brand)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const metricIcons: Record<string, typeof BarChart3> = {
  dialogsPerDay: MessageSquare,
  avgResponseLength: BarChart3,
  conversion: Target,
  tokenCost: DollarSign,
  responseTime: Clock,
};

export default function MetricsTab({ agentId, token }: MetricsTabProps) {
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/analytics?agentId=${agentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setMetrics(data);
        } else if (data.metrics) {
          setMetrics(data.metrics);
        } else {
          setMetrics([
            {
              label: t('metrics.dialogsPerDay'),
              value: data.dialogsPerDay ?? 0,
              unit: '',
              trend: 'neutral',
              trendValue: 0,
              sparkline: data.dialogsSparkline ?? [],
            },
            {
              label: t('metrics.avgResponseLength'),
              value: data.avgResponseLength ?? 0,
              unit: 'симв.',
              trend: 'neutral',
              trendValue: 0,
            },
            {
              label: t('metrics.conversion'),
              value: data.conversion ?? 0,
              unit: '%',
              trend: 'neutral',
              trendValue: 0,
            },
            {
              label: t('metrics.tokenCost'),
              value: data.tokenCost ?? 0,
              unit: '₽',
              trend: 'neutral',
              trendValue: 0,
            },
            {
              label: t('metrics.responseTime'),
              value: data.responseTime ?? 0,
              unit: 'с',
              trend: 'neutral',
              trendValue: 0,
            },
          ]);
        }
      } else {
        console.error('[MetricsTab] fetch failed:', res.status);
      }
    } catch (err) {
      console.error('[MetricsTab]', err);
      setMetrics([]);
    }
    setLoading(false);
  }, [agentId, token]);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  if (loading) {
    return <div className="p-5 grid grid-cols-2 gap-4"><Skeleton variant="card" /><Skeleton variant="card" /><Skeleton variant="card" /><Skeleton variant="card" /></div>;
  }

  if (metrics.length === 0) {
    return (
      <div className="p-5 flex flex-col items-center justify-center py-16">
        <BarChart3 size={32} className="text-[var(--text-muted)] mb-3" />
        <p className="text-[14px] text-[var(--text-muted)]">{t('metrics.noData')}</p>
      </div>
    );
  }

  const trendIcon = (trend: MetricData['trend']) => {
    if (trend === 'up') return <TrendingUp size={14} className="text-[var(--success)]" />;
    if (trend === 'down') return <TrendingDown size={14} className="text-[var(--danger)]" />;
    return <Minus size={14} className="text-[var(--text-muted)]" />;
  };

  return (
    <div className="p-5">
      <h2 className="text-[20px] font-semibold text-[var(--text)] mb-5">{t('metrics.title')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {metrics.map((metric) => {
          const key = metric.label.toLowerCase().replace(/[^a-zа-яё]/gi, '');
          const Icon = metricIcons[key] || BarChart3;
          return (
            <Card key={metric.label} padding="large">
              <div className="flex items-start justify-between mb-2">
                <div className="w-9 h-9 rounded-[var(--radius-button)] bg-[var(--accent-soft)] flex items-center justify-center">
                  <Icon size={18} className="text-[var(--brand)]" />
                </div>
                <div className="flex items-center gap-1">
                  {trendIcon(metric.trend)}
                  <span className={`text-[12px] font-medium ${
                    metric.trend === 'up' ? 'text-[var(--success)]' :
                    metric.trend === 'down' ? 'text-[var(--danger)]' :
                    'text-[var(--text-muted)]'
                  }`}>
                    {metric.trendValue > 0 ? '+' : ''}{metric.trendValue}{metric.unit}
                  </span>
                </div>
              </div>
              <p className="text-[12px] text-[var(--text-muted)] mb-1">{metric.label}</p>
              <div className="flex items-end gap-3">
                <p className="text-[28px] font-semibold text-[var(--text)] tracking-[-0.02em]">
                  {typeof metric.value === 'number' ? metric.value.toLocaleString('ru-RU') : metric.value}
                </p>
                <span className="text-[13px] text-[var(--text-muted)] mb-1">{metric.unit}</span>
              </div>
              {metric.sparkline && metric.sparkline.length > 1 && (
                <div className="mt-3">
                  <Sparkline data={metric.sparkline} />
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
