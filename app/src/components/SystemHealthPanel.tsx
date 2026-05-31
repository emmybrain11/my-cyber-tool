import { useEffect, useState } from 'react';
import HealthBar from './HealthBar';
import { trpc } from '@/providers/trpc';

const STATUS_COLORS: Record<string, string> = {
  healthy: 'var(--accent-green)',
  degraded: 'var(--accent-yellow)',
  critical: 'var(--accent-red)',
};

const STATUS_LABELS: Record<string, string> = {
  healthy: 'Active',
  degraded: 'Degraded',
  critical: 'Critical',
};

export default function SystemHealthPanel() {
  const { data } = trpc.health.list.useQuery();
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Map metrics to health bars
  const healthBars = [
    { metric: 'network_uptime', label: 'Network Uptime', color: 'var(--accent-green)' },
    { metric: 'ids_coverage', label: 'IDS Coverage', color: 'var(--accent-yellow)' },
    { metric: 'patch_compliance', label: 'Patch Compliance', color: 'var(--accent-cyan)' },
  ];

  // Map metrics to status indicators
  const statusIndicators = [
    { metric: 'firewall', label: 'Firewall' },
    { metric: 'ids', label: 'IDS' },
    { metric: 'waf', label: 'WAF' },
    { metric: 'edr', label: 'EDR' },
  ];

  const getMetricValue = (metricKey: string): number => {
    const metric = data?.metrics?.find((m: any) => m.metric === metricKey);
    return metric ? Number(metric.value) : 0;
  };

  const getMetricStatus = (metricKey: string): string => {
    const metric = data?.metrics?.find((m: any) => m.metric === metricKey);
    return metric?.status ?? 'healthy';
  };

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '8px',
        padding: '24px',
      }}
    >
      {/* Panel header */}
      <div className="mb-3">
        <span
          style={{
            fontFamily: "'Space Mono', monospace",
            fontWeight: 500,
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
          }}
        >
          SYSTEM HEALTH
        </span>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '12px 0 20px' }} />

      {/* Health bars */}
      <div className="flex flex-col gap-4 mb-6">
        {healthBars.map((bar, i) => (
          <HealthBar
            key={bar.metric}
            label={bar.label}
            value={animated ? getMetricValue(bar.metric) : 0}
            color={bar.color}
            delay={i * 0.2}
          />
        ))}
      </div>

      {/* Status indicators grid */}
      <div className="grid grid-cols-2 gap-3">
        {statusIndicators.map((ind) => {
          const status = getMetricStatus(ind.metric);
          return (
            <div
              key={ind.metric}
              className="flex items-center gap-2 px-3 py-2 rounded"
              style={{ background: 'var(--bg-elevated)' }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: STATUS_COLORS[status] ?? 'var(--accent-green)',
                }}
              />
              <span
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 500,
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                }}
              >
                {ind.label}
              </span>
              <span
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontWeight: 400,
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  marginLeft: 'auto',
                }}
              >
                {STATUS_LABELS[status] ?? 'Active'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
