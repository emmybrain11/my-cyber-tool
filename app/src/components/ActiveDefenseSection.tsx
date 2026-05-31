import { useRef, useState } from 'react';
import { Shield } from 'lucide-react';
import { trpc } from '@/providers/trpc';

const ACCENT_COLORS: Record<string, string> = {
  blocked_ips: 'var(--accent-red)',
  mitre_techniques: 'var(--accent-yellow)',
  agents_online: 'var(--accent-green)',
  siem_alerts: 'var(--accent-cyan)',
  response_time: 'var(--accent-yellow)',
};

const SEVERITY_COLORS: Record<string, { dot: string; text: string }> = {
  critical: { dot: 'var(--accent-red)', text: 'var(--accent-red)' },
  high: { dot: 'var(--accent-red)', text: '#ff6666' },
  medium: { dot: 'var(--accent-yellow)', text: 'var(--accent-yellow)' },
  low: { dot: 'var(--accent-green)', text: 'var(--accent-green)' },
};

const EVENT_STATUS_LABELS: Record<string, string> = {
  block: 'Blocked',
  alert: 'Alert',
  quarantine: 'Quarantined',
  mitigate: 'Mitigated',
  monitor: 'Monitoring',
};

export default function ActiveDefenseSection() {
  const { data: statsData } = trpc.dashboard.stats.useQuery();
  const { data: activityData } = trpc.defense.list.useQuery({ limit: 10 });

  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  const metrics = [
    { key: 'blocked_ips', label: 'Blocked IPs' },
    { key: 'mitre_techniques', label: 'MITRE Techniques' },
    { key: 'agents_online', label: 'Agents Online' },
    { key: 'siem_alerts', label: 'SIEM Alerts' },
    { key: 'response_time', label: 'Response Time' },
  ];

  const getMetricValue = (key: string): string => {
    // Use dashboard stats or fallback
    switch (key) {
      case 'blocked_ips':
        return '1,247';
      case 'mitre_techniques':
        return '31';
      case 'agents_online':
        return '892';
      case 'siem_alerts':
        return statsData?.threatsDetected?.toString() ?? '23';
      case 'response_time':
        return '1.2s';
      default:
        return '0';
    }
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield size={16} style={{ color: 'var(--accent-cyan)' }} />
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
            ACTIVE DEFENSE
          </span>
        </div>
        <span
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '12px',
            color: 'var(--text-muted)',
          }}
        >
          Last updated: 2 min ago
        </span>
      </div>

      {/* Metrics sub-row */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {metrics.map((metric) => (
          <div
            key={metric.key}
            className="transition-all duration-200 hover:translate-y-[-1px]"
            style={{
              background: 'var(--bg-elevated)',
              borderRadius: '6px',
              padding: '16px',
              borderLeft: `3px solid ${ACCENT_COLORS[metric.key] ?? 'var(--accent-yellow)'}`,
            }}
          >
            <div
              style={{
                fontFamily: "'Space Mono', monospace",
                fontWeight: 500,
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-muted)',
                marginBottom: '6px',
              }}
            >
              {metric.label}
            </div>
            <div
              style={{
                fontFamily: "'Space Mono', monospace",
                fontWeight: 700,
                fontSize: '28px',
                color: 'var(--text-primary)',
                lineHeight: 1.0,
              }}
            >
              {getMetricValue(metric.key)}
            </div>
          </div>
        ))}
      </div>

      {/* Activity feed */}
      <div
        ref={feedRef}
        style={{
          maxHeight: '200px',
          overflowY: 'auto',
        }}
      >
        {(activityData?.events ?? []).map((event: any, index: number) => {
          const severityColors = SEVERITY_COLORS[event.severity ?? 'medium'] ?? SEVERITY_COLORS.medium;
          const statusLabel = EVENT_STATUS_LABELS[event.eventType] ?? event.eventType;

          return (
            <div
              key={event.id}
              className="transition-colors duration-150"
              style={{
                padding: '12px 0',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'grid',
                gridTemplateColumns: '80px 1fr 180px 80px',
                gap: '16px',
                alignItems: 'center',
                background: hoveredRow === index ? 'rgba(255,255,255,0.02)' : 'transparent',
              }}
              onMouseEnter={() => setHoveredRow(index)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              <span
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontWeight: 400,
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                }}
              >
                {event.createdAt
                  ? new Date(event.createdAt).toLocaleTimeString('en-US', {
                      hour12: false,
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })
                  : '--:--:--'}
              </span>
              <span
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 400,
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                }}
              >
                {event.description}
              </span>
              <span
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontWeight: 400,
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                }}
              >
                {event.source ?? '--'} {event.target ? `→ ${event.target}` : ''}
              </span>
              <div className="flex items-center gap-2">
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: severityColors.dot,
                  }}
                />
                <span
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontWeight: 400,
                    fontSize: '11px',
                    color: severityColors.text,
                  }}
                >
                  {statusLabel}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
