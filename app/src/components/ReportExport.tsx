import { useState, useRef } from 'react';
import { Download, FileJson, Calendar, Filter } from 'lucide-react';
import { trpc } from '@/providers/trpc';
import { useAuth } from '@/hooks/useAuth';

const MODULE_OPTIONS = [
  { value: 'all', label: 'All Modules' },
  { value: 'recon', label: 'Reconnaissance' },
  { value: 'audit', label: 'Security Audit' },
  { value: 'defense', label: 'Active Defense' },
  { value: 'cyber_range', label: 'Cyber Range' },
  { value: 'synthesis', label: 'AI Synthesis' },
];

export default function ReportExport() {
  const { user } = useAuth();
  const [reportName, setReportName] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const downloadRef = useRef<HTMLAnchorElement>(null);

  const generateMutation = trpc.report.generate.useMutation({
    onSuccess: (data) => {
      setIsGenerating(false);
      setDownloadUrl(data.downloadUrl);

      // Auto-trigger download as JSON file
      const blob = new Blob([JSON.stringify(data.reportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.report.name.replace(/\s+/g, '_')}_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    onError: () => {
      setIsGenerating(false);
    },
  });

  const handleGenerate = () => {
    if (!user) {
      alert('Please sign in to generate reports');
      return;
    }
    if (!reportName.trim()) {
      setReportName(`Security_Report_${new Date().toISOString().split('T')[0]}`);
    }
    setIsGenerating(true);
    setDownloadUrl(null);

    generateMutation.mutate({
      name: reportName.trim() || `Security_Report_${new Date().toISOString().split('T')[0]}`,
      moduleFilter: moduleFilter === 'all' ? undefined : moduleFilter,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    });
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
        <FileJson size={16} style={{ color: 'var(--accent-yellow)' }} />
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
          EXPORT REPORT
        </span>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0 0 20px' }} />

      {/* Form */}
      <div className="flex flex-col gap-4">
        {/* Report name */}
        <div>
          <label
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 500,
              fontSize: '13px',
              color: 'var(--text-secondary)',
              display: 'block',
              marginBottom: '6px',
            }}
          >
            Report Name
          </label>
          <input
            type="text"
            value={reportName}
            onChange={(e) => setReportName(e.target.value)}
            placeholder="e.g., Weekly Security Summary"
            style={{
              width: '100%',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '10px 14px',
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '14px',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-yellow)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
            }}
          />
        </div>

        {/* Module filter */}
        <div>
          <label
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 500,
              fontSize: '13px',
              color: 'var(--text-secondary)',
              display: 'block',
              marginBottom: '6px',
            }}
          >
            <Filter size={12} className="inline mr-1" />
            Module Filter
          </label>
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '10px 14px',
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '14px',
              color: 'var(--text-primary)',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {MODULE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 500,
                fontSize: '13px',
                color: 'var(--text-secondary)',
                display: 'block',
                marginBottom: '6px',
              }}
            >
              <Calendar size={12} className="inline mr-1" />
              From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '10px 14px',
                fontFamily: "'Space Mono', monospace",
                fontSize: '13px',
                color: 'var(--text-primary)',
                outline: 'none',
                colorScheme: 'dark',
              }}
            />
          </div>
          <div>
            <label
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 500,
                fontSize: '13px',
                color: 'var(--text-secondary)',
                display: 'block',
                marginBottom: '6px',
              }}
            >
              To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '10px 14px',
                fontFamily: "'Space Mono', monospace",
                fontSize: '13px',
                color: 'var(--text-primary)',
                outline: 'none',
                colorScheme: 'dark',
              }}
            />
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-md transition-all duration-200"
          style={{
            background: isGenerating ? 'var(--bg-hover)' : 'var(--accent-yellow)',
            color: isGenerating ? 'var(--text-muted)' : '#000000',
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 600,
            fontSize: '14px',
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            opacity: isGenerating ? 0.7 : 1,
          }}
        >
          {isGenerating ? (
            <>
              <div
                className="animate-spin"
                style={{
                  width: 16,
                  height: 16,
                  border: '2px solid var(--text-muted)',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                }}
              />
              Generating...
            </>
          ) : (
            <>
              <Download size={16} />
              Generate JSON Report
            </>
          )}
        </button>

        {/* Success message */}
        {downloadUrl && (
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-md"
            style={{
              background: 'rgba(0, 255, 136, 0.1)',
              border: '1px solid rgba(0, 255, 136, 0.2)',
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--accent-green)',
              }}
            />
            <span
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '13px',
                color: 'var(--accent-green)',
              }}
            >
              Report generated and downloaded!
            </span>
          </div>
        )}

        {/* Error for non-authenticated */}
        {!user && (
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-md"
            style={{
              background: 'rgba(255, 68, 68, 0.1)',
              border: '1px solid rgba(255, 68, 68, 0.2)',
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--accent-red)',
              }}
            />
            <span
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '13px',
                color: 'var(--accent-red)',
              }}
            >
              Sign in to generate reports
            </span>
          </div>
        )}
      </div>

      <a ref={downloadRef} style={{ display: 'none' }} />
    </div>
  );
}
