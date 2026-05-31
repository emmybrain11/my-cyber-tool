import { useState } from 'react';
import {
  Radar,
  ClipboardCheck,
  ShieldCheck,
  Gamepad2,
  BrainCircuit,
  ChevronRight,
} from 'lucide-react';
import { trpc } from '@/providers/trpc';

const MODULES = [
  {
    key: 'recon',
    label: 'Recon',
    fullName: 'Reconnaissance',
    description: 'Network discovery, port scanning, and asset mapping',
    icon: Radar,
    accent: 'var(--accent-cyan)',
    command: 'show modules recon',
  },
  {
    key: 'audit',
    label: 'Audit',
    fullName: 'Security Audit',
    description: 'Vulnerability scanning and compliance checks',
    icon: ClipboardCheck,
    accent: 'var(--accent-yellow)',
    command: 'show modules audit',
  },
  {
    key: 'defense',
    label: 'Defense',
    fullName: 'Active Defense',
    description: 'Real-time threat blocking and mitigation',
    icon: ShieldCheck,
    accent: 'var(--accent-green)',
    command: 'show modules defense',
  },
  {
    key: 'cyber_range',
    label: 'Cyber Range',
    fullName: 'Cyber Range',
    description: 'Red/Blue team simulation exercises',
    icon: Gamepad2,
    accent: 'var(--accent-red)',
    command: 'show modules cyber_range',
  },
  {
    key: 'synthesis',
    label: 'Synthesis',
    fullName: 'AI Synthesis',
    description: 'Ollama-powered threat intelligence analysis',
    icon: BrainCircuit,
    accent: 'var(--accent-cyan)',
    command: 'show modules synthesis',
  },
];

export default function ModuleZones() {
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);
  const [runningModule, setRunningModule] = useState<string | null>(null);
  const createScan = trpc.scan.create.useMutation();

  const handleActivate = (moduleKey: string) => {
    setRunningModule(moduleKey);
    createScan.mutate(
      { module: moduleKey, target: `${moduleKey}-target-01` },
      {
        onSettled: () => {
          setTimeout(() => setRunningModule(null), 2000);
        },
      }
    );
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
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
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
          MODULE ZONES
        </span>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0 0 20px' }} />

      {/* Module grid */}
      <div className="grid grid-cols-5 gap-3">
        {MODULES.map((mod) => {
          const Icon = mod.icon;
          const isHovered = hoveredModule === mod.key;
          const isRunning = runningModule === mod.key;

          return (
            <button
              key={mod.key}
              className="flex flex-col items-start gap-3 p-4 rounded-md transition-all duration-200 text-left"
              style={{
                background: isHovered ? 'var(--bg-elevated)' : 'var(--bg-primary)',
                border: `1px solid ${isHovered ? mod.accent : 'var(--border-subtle)'}`,
                cursor: 'pointer',
              }}
              onMouseEnter={() => setHoveredModule(mod.key)}
              onMouseLeave={() => setHoveredModule(null)}
              onClick={() => handleActivate(mod.key)}
            >
              <div
                className="flex items-center justify-center w-10 h-10 rounded-md"
                style={{ background: `${mod.accent}15` }}
              >
                <Icon size={20} style={{ color: mod.accent }} />
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 600,
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    marginBottom: '2px',
                  }}
                >
                  {mod.label}
                </div>
                <div
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 400,
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    lineHeight: 1.4,
                  }}
                >
                  {mod.fullName}
                </div>
              </div>
              <div className="mt-auto flex items-center gap-1">
                {isRunning ? (
                  <div
                    className="animate-spin"
                    style={{
                      width: 12,
                      height: 12,
                      border: `2px solid ${mod.accent}`,
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                    }}
                  />
                ) : (
                  <>
                    <span
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        fontSize: '10px',
                        color: isHovered ? mod.accent : 'var(--text-muted)',
                      }}
                    >
                      Activate
                    </span>
                    <ChevronRight
                      size={10}
                      style={{
                        color: isHovered ? mod.accent : 'var(--text-muted)',
                        transform: isHovered ? 'translateX(2px)' : 'translateX(0)',
                        transition: 'transform 0.2s ease',
                      }}
                    />
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
