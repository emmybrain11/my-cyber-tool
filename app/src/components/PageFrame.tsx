import { useLocation, useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export default function PageFrame({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const showBack = location.pathname !== "/";

  const handleBack = () => {
    if (window.history.state?.idx > 0) {
      navigate(-1);
      return;
    }
    navigate("/");
  };

  return (
    <div className="page-frame min-h-screen overflow-hidden relative bg-[radial-gradient(circle_at_top_left,_rgba(0,212,255,0.10),_transparent_25%),radial-gradient(circle_at_top_right,_rgba(232,255,0,0.08),_transparent_22%),radial-gradient(circle_at_bottom_left,_rgba(0,255,136,0.06),_transparent_18%),#050505]">
      <div className="cyber-grid" />
      <div className="cyber-glow" />
      <div className="cyber-particles" />

      {showBack ? (
        <button
          type="button"
          onClick={handleBack}
          className="back-button flex items-center gap-2 rounded-full border border-[rgba(232,255,0,0.18)] bg-black/40 px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--accent-yellow)] hover:bg-black/70"
        >
          <ArrowLeft size={16} />
          Back
        </button>
      ) : null}

      <div className="page-frame-content relative z-10">{children}</div>
    </div>
  );
}
