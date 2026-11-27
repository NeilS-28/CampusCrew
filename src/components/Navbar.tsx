'use client';

interface NavbarProps {
  savedAlias: string;
  onCreateSession: () => void;
  signOut?: () => void;
}

export default function Navbar({ savedAlias, onCreateSession, signOut }: NavbarProps) {
  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        background: 'rgba(9, 13, 22, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #1e293b',
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 800,
              fontSize: 16,
            }}
          >
            C
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em' }}>CampusCrew</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Verified Campus Activity Board</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              background: '#111827',
              border: '1px solid #1e293b',
              fontSize: 13,
              color: '#cbd5e1',
            }}
          >
            @{savedAlias}
          </span>
          <button
            onClick={onCreateSession}
            style={{
              padding: '8px 14px',
              borderRadius: 9,
              background: '#6366f1',
              color: '#fff',
              border: 'none',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            + New Session
          </button>
          <button
            onClick={signOut}
            style={{
              padding: '8px 12px',
              borderRadius: 9,
              background: 'transparent',
              color: '#94a3b8',
              border: '1px solid #1e293b',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}
