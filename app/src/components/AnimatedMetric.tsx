import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

interface AnimatedMetricProps {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  decimals?: number;
}

export default function AnimatedMetric({
  value,
  suffix = '',
  prefix = '',
  duration = 1.2,
  decimals = 0,
}: AnimatedMetricProps) {
  const displayRef = useRef<HTMLSpanElement>(null);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const obj = { val: 0 };
    gsap.to(obj, {
      val: value,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        if (decimals === 0) {
          setDisplayValue(Math.floor(obj.val));
        } else {
          setDisplayValue(Number(obj.val.toFixed(decimals)));
        }
      },
    });
  }, [value, duration, decimals]);

  return (
    <span ref={displayRef} className="metric-value">
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
}
