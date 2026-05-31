import AnimatedMetric from './AnimatedMetric';

interface MetricCardProps {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  status?: {
    text: string;
    color: string;
  };
  delay?: number;
}

export default function MetricCard({
  label,
  value,
  suffix = '',
  prefix = '',
  decimals = 0,
  status,
  delay = 0,
}: MetricCardProps) {
  return (
    <div
      className="metric-card"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '8px',
        padding: '24px',
        animation: `fadeInUp 0.4s ${delay}s both`,
      }}
    >
      <div
        style={{
          fontFamily: "'Space Mono', monospace",
          fontWeight: 500,
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-muted)',
          marginBottom: '8px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "'Space Mono', monospace",
          fontWeight: 700,
          fontSize: '48px',
          color: status?.color ?? 'var(--text-primary)',
          lineHeight: 1.0,
        }}
      >
        <AnimatedMetric
          value={value}
          suffix={suffix}
          prefix={prefix}
          decimals={decimals}
        />
      </div>
      {status && (
        <div className="flex items-center gap-2 mt-3">
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: status.color,
            }}
          />
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 400,
              fontSize: '13px',
              color: 'var(--text-secondary)',
            }}
          >
            {status.text}
          </span>
        </div>
      )}
    </div>
  );
}
