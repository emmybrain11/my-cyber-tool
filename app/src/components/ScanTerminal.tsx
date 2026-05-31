import { useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { RefreshCw } from 'lucide-react';

const SCAN_TEXT = `Scanning target: 192.168.1.0/24
Discovered 4,271 active hosts
Resolving hostnames... done
Probing open ports... 12,847 ports analyzed
Service fingerprinting... 8,932 services identified
OS detection... 3,441 matches
Vulnerability assessment... 0 critical, 2 medium

Scan completed in 00:04:32`;

export default function ScanTerminal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isAnimatingRef = useRef(false);

  const runAnimation = useCallback(() => {
    if (!containerRef.current || isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    const container = containerRef.current;
    const wordsB = container.querySelectorAll<HTMLElement>('.scan-line .word');
    const words = container.querySelectorAll<HTMLElement>('.scan-reveal .word');
    const scanContainer = container.querySelector<HTMLElement>('.scan-container');

    if (!wordsB.length || !words.length || !scanContainer) {
      isAnimatingRef.current = false;
      return;
    }

    // Reset all to initial state
    gsap.set(wordsB, { opacity: 0, yPercent: -100 });
    gsap.set(words, { opacity: 0, clipPath: 'inset(0 100% 0 0)' });
    gsap.set(scanContainer, { opacity: 0, x: '-100%' });

    const tl = gsap.timeline({
      defaults: { ease: 'power2.in' },
      onComplete: () => {
        isAnimatingRef.current = false;
      },
    });

    // Animate scan line words (yellow glow layer)
    tl.fromTo(
      wordsB,
      { opacity: 0, yPercent: -100 },
      { opacity: 1, yPercent: 0, stagger: 0.1 },
      0
    );

    // Animate scan container glow sweep
    tl.fromTo(
      scanContainer,
      { opacity: 0, x: '-100%' },
      { opacity: 1, x: '100%', ease: 'power1.inOut', duration: 1 },
      0
    );

    // Animate reveal words (white text clip-path wipe)
    tl.fromTo(
      words,
      { clipPath: 'inset(0 100% 0 0)' },
      { clipPath: 'inset(0 0% 0 0)', duration: 1, stagger: 0.1, ease: 'none' },
      0
    );

    // Fade in all words to full opacity
    tl.to(words, { opacity: 1, duration: 0.3 }, '-=0.5');
  }, []);

  useEffect(() => {
    // Simple word splitting without Splitting.js library
    const container = containerRef.current;
    if (!container) return;

    const scanLine = container.querySelector('.scan-line') as HTMLElement;
    const scanReveal = container.querySelector('.scan-reveal') as HTMLElement;

    if (!scanLine || !scanReveal) return;

    // Split text into words and wrap each
    const splitIntoWords = (element: HTMLElement) => {
      const text = element.textContent || '';
      const lines = text.split('\n');
      element.innerHTML = '';

      lines.forEach((line) => {
        const lineDiv = document.createElement('div');
        lineDiv.style.display = 'block';

        if (line.trim() === '') {
          lineDiv.innerHTML = '<br/>';
        } else {
          const words = line.split(' ');
          words.forEach((word, wordIndex) => {
            const wordSpan = document.createElement('span');
            wordSpan.className = 'word';
            wordSpan.textContent = word;
            lineDiv.appendChild(wordSpan);

            if (wordIndex < words.length - 1) {
              const space = document.createElement('span');
              space.className = 'whitespace';
              space.innerHTML = '&nbsp;';
              lineDiv.appendChild(space);
            }
          });
        }

        element.appendChild(lineDiv);
      });
    };

    splitIntoWords(scanLine);
    splitIntoWords(scanReveal);

    // Start animation after a short delay
    const timer = setTimeout(runAnimation, 500);
    return () => clearTimeout(timer);
  }, [runAnimation]);

  const handleRerun = () => {
    if (isAnimatingRef.current) return;
    runAnimation();
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
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
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
            SCAN RESULTS
          </span>
          <span
            className="pulse-live"
            style={{
              background: 'rgba(0, 255, 136, 0.1)',
              color: 'var(--accent-green)',
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '10px',
              fontFamily: "'Space Mono', monospace",
            }}
          >
            Live
          </span>
        </div>
        <button
          onClick={handleRerun}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all duration-300 hover:text-[var(--accent-yellow)]"
          style={{
            color: 'var(--text-muted)',
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '12px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--accent-yellow)';
            const icon = e.currentTarget.querySelector('svg');
            if (icon) icon.style.transform = 'rotate(180deg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)';
            const icon = e.currentTarget.querySelector('svg');
            if (icon) icon.style.transform = 'rotate(0deg)';
          }}
        >
          <RefreshCw size={14} className="transition-transform duration-300" />
          Re-run
        </button>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '12px 0' }} />

      {/* Terminal content */}
      <div className="scan-terminal" ref={containerRef}>
        {/* Yellow scan line layer (behind) */}
        <div className="scan-line" aria-hidden="true">
          {SCAN_TEXT}
        </div>
        {/* White reveal layer (front) */}
        <div className="scan-container scan-reveal">
          {SCAN_TEXT}
        </div>
      </div>
    </div>
  );
}
