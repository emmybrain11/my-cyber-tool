import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface HealthBarProps {
  label: string;
  value: number;
  color: string;
  delay?: number;
}

export default function HealthBar({ label, value, color, delay = 0 }: HealthBarProps) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!barRef.current) return;
    gsap.fromTo(
      barRef.current,
      { width: '0%' },
      {
        width: `${value}%`,
        duration: 1.2,
        ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
        delay: delay + 0.3,
      }
    );
  }, [value, delay]);

  return (
    <div className="health-bar">
      <div className="flex items-center justify-between mb-2">
        <span
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 500,
            fontSize: '14px',
            color: 'var(--text-secondary)',
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: "'Space Mono', monospace",
            fontWeight: 400,
            fontSize: '14px',
            color: 'var(--text-primary)',
          }}
        >
          {value}%
        </span>
      </div>
      <div className="health-bar-track">
        <div
          ref={barRef}
          className="health-bar-fill"
          style={{ backgroundColor: color, width: '0%' }}
        />
      </div>
    </div>
  );
}
