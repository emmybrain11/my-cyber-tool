import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import MetricCard from '@/components/MetricCard';
import ScanTerminal from '@/components/ScanTerminal';
import SystemHealthPanel from '@/components/SystemHealthPanel';
import ActiveDefenseSection from '@/components/ActiveDefenseSection';
import ReportExport from '@/components/ReportExport';
import ModuleZones from '@/components/ModuleZones';
import { trpc } from '@/providers/trpc';
import { Satellite } from 'lucide-react';

export default function Home() {
  const { data: stats } = trpc.dashboard.stats.useQuery();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        position: 'relative',
      }}
    >
      {/* Ambient background glow behind terminal */}
      <div
        style={{
          position: 'absolute',
          top: '35%',
          left: '30%',
          width: '40%',
          height: '40%',
          background: 'radial-gradient(ellipse, rgba(232, 255, 0, 0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Navigation */}
      <Navigation />

      {/* Main content */}
      <main
        style={{
          padding: '88px 32px 32px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Hero branding */}
        <div className="flex items-center gap-4 mb-8">
          <img
            src="/satellite-hero.png"
            alt="Emmy Brain Tool"
            style={{ width: 48, height: 48, objectFit: 'contain' }}
          />
          <div>
            <h1
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: '28px',
                color: 'var(--text-primary)',
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
              }}
            >
              Sentinel Cyber Lab{' '}
              <span style={{ fontSize: '20px' }}>🛰️</span>
            </h1>
            <p
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '12px',
                color: 'var(--text-muted)',
                marginTop: '4px',
              }}
            >
              Cybersecurity command, offense, defense, and AI assistance
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <a
                href="/register"
                className="inline-flex items-center rounded-full bg-[var(--accent-yellow)] px-4 py-2 text-sm font-semibold text-black"
              >
                Request access
              </a>
              <span
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '12px',
                  color: 'var(--accent-yellow)',
                }}
              >
                Built by 🔏emmy-brain-codes🛰️ — security first system
              </span>
            </div>
          </div>
        </div>

        {/* Metric Cards Row */}
        <div
          className="grid grid-cols-4 gap-5 mb-12"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.4s ease-out, transform 0.4s ease-out',
          }}
        >
          <MetricCard
            label="TOTAL ASSETS"
            value={stats?.totalAssets ?? 4271}
            delay={0}
          />
          <MetricCard
            label="ACTIVE SCANS"
            value={stats?.activeScans ?? 3}
            status={{ text: 'Running', color: 'var(--accent-green)' }}
            delay={0.1}
          />
          <MetricCard
            label="SCANS TODAY"
            value={stats?.scansToday ?? 12}
            delay={0.2}
          />
          <MetricCard
            label="THREATS"
            value={stats?.threatsDetected ?? 0}
            status={{
              text: (stats?.threatsDetected ?? 0) > 0 ? 'Alert' : 'Clear',
              color: (stats?.threatsDetected ?? 0) > 0 ? 'var(--accent-red)' : 'var(--accent-green)',
            }}
            delay={0.3}
          />
        </div>

        {/* Module Zones */}
        <div className="mb-8">
          <div
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.5s ease-out 0.4s, transform 0.5s ease-out 0.4s',
            }}
          >
            <ModuleZones />
          </div>
        </div>

        {/* Quick access tools */}
        <div className="grid grid-cols-3 gap-5 mb-8">
          <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Workbench</h3>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Build payloads, run scripts, and test offensive tooling in a safe lab workflow.
            </p>
            <a
              href="/workbench"
              className="mt-4 inline-flex items-center rounded-full bg-[var(--accent-yellow)] px-4 py-2 text-sm font-semibold text-black"
            >
              Open Workbench
            </a>
          </div>
          <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-sm">
            <h3 className="text-lg font-semibold">AI Assistant</h3>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Ask the AI for exact commands, payload fixes, and defensive recommendations.
            </p>
            <a
              href="/assistant"
              className="mt-4 inline-flex items-center rounded-full bg-[var(--accent-yellow)] px-4 py-2 text-sm font-semibold text-black"
            >
              Open AI Lab
            </a>
          </div>
          <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Live Operations</h3>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Launch live scans and review defense telemetry from the same dashboard.
            </p>
            <a
              href="/"
              className="mt-4 inline-flex items-center rounded-full bg-[var(--accent-yellow)] px-4 py-2 text-sm font-semibold text-black"
            >
              View Dashboard
            </a>
          </div>
        </div>

        {/* Two-column layout: Scan Terminal + System Health */}
        <div className="grid grid-cols-12 gap-5 mb-8">
          <div className="col-span-7">
            <div
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(20px)',
                transition: 'opacity 0.5s ease-out 0.5s, transform 0.5s ease-out 0.5s',
              }}
            >
              <ScanTerminal />
            </div>
          </div>
          <div className="col-span-5">
            <div
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(20px)',
                transition: 'opacity 0.5s ease-out 0.8s, transform 0.5s ease-out 0.8s',
              }}
            >
              <SystemHealthPanel />
            </div>
          </div>
        </div>

        {/* Three-column layout: Active Defense + Report Export */}
        <div className="grid grid-cols-12 gap-5 mb-8">
          <div className="col-span-8">
            <div
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(30px)',
                transition: 'opacity 0.5s ease-out 1.2s, transform 0.5s ease-out 1.2s',
              }}
            >
              <ActiveDefenseSection />
            </div>
          </div>
          <div className="col-span-4">
            <div
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(30px)',
                transition: 'opacity 0.5s ease-out 1.4s, transform 0.5s ease-out 1.4s',
              }}
            >
              <ReportExport />
            </div>
          </div>
        </div>

        {/* Footer branding */}
        <footer
          className="flex items-center justify-between py-6 mt-8"
          style={{
            borderTop: '1px solid var(--border-subtle)',
            opacity: mounted ? 1 : 0,
            transition: 'opacity 0.5s ease-out 1.6s',
          }}
        >
          <div className="flex items-center gap-2">
            <Satellite size={14} style={{ color: 'var(--text-muted)' }} />
            <span
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '11px',
                color: 'var(--text-muted)',
              }}
            >
              Sentinel Cyber Lab v2.0 — Cybersecurity Command Framework
            </span>
          </div>
          <span
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: '11px',
              color: 'var(--text-muted)',
            }}
          >
            {new Date().toISOString().split('T')[0]} UTC
          </span>
        </footer>
      </main>
    </div>
  );
}
