import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import {
  Bell,
  LayoutDashboard,
  Radar,
  Server,
  Terminal,
  MessageSquare,
  LogIn,
  LogOut,
} from 'lucide-react';

export default function Navigation() {
  const location = useLocation();
  const { user, logout, isLoading } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navLinks = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/workbench', label: 'Workbench', icon: Terminal },
    { path: '/crypto', label: 'Crypto Lab', icon: Radar },
    { path: '/assistant', label: 'AI Assistant', icon: MessageSquare },
    ...(user?.role === 'admin'
      ? [{ path: '/admin', label: 'Admin', icon: Server }]
      : []),
  ];

  return (
    <nav
      style={{
        height: '56px',
        background: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0 32px',
        zIndex: 100,
      }}
      className="fixed top-0 left-0 right-0 flex items-center justify-between"
    >
      {/* Left cluster: wordmark */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div
            className="pulse-dot"
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
              fontWeight: 600,
              fontSize: '18px',
              color: 'var(--text-primary)',
              letterSpacing: '0.05em',
            }}
          >
            SENTINEL
          </span>
        </div>
      </div>

      {/* Center cluster: nav links */}
      <div className="flex items-center gap-1">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.path;
          const Icon = link.icon;
          return (
            <Link
              key={link.path}
              to={link.path}
              className="flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200"
              style={{
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderBottom: isActive ? '2px solid var(--accent-yellow)' : '2px solid transparent',
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 500,
                fontSize: '15px',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <Icon size={16} />
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* Right cluster: user + notifications */}
      <div className="flex items-center gap-3">
        <button
          className="relative p-2 rounded-md transition-colors duration-200 hover:bg-[var(--bg-elevated)]"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Bell size={18} strokeWidth={1.5} />
          <span
            className="absolute top-1 right-1"
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--accent-red)',
            }}
          />
        </button>

        {isLoading ? (
          <div className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] animate-pulse" />
        ) : user ? (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-2 py-1 rounded-md transition-colors duration-200 hover:bg-[var(--bg-elevated)]"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name ?? 'User'}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    background: 'var(--bg-elevated)',
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 500,
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {(user.name ?? 'U').slice(0, 2).toUpperCase()}
                </div>
              )}
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div
                  className="absolute right-0 top-full mt-2 py-2 rounded-lg z-50"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    minWidth: '180px',
                  }}
                >
                  <div className="px-4 py-2 border-b border-[var(--border-subtle)]">
                    <p
                      style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontWeight: 500,
                        fontSize: '14px',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {user.name ?? 'User'}
                    </p>
                    <p
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {user.email ?? ''}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 transition-colors duration-200 hover:bg-[var(--bg-elevated)]"
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: '14px',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <LogOut size={14} />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/register"
              className="px-3 py-1.5 rounded-md bg-[var(--accent-yellow)] text-black transition-colors duration-200 hover:opacity-90"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '14px',
              }}
            >
              Request Access
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors duration-200 hover:bg-[var(--bg-elevated)]"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '14px',
                color: 'var(--text-secondary)',
              }}
            >
              <LogIn size={14} />
              Login
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
