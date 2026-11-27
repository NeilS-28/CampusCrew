'use client';

import { CATEGORIES } from '@/lib/constants';
import type { SessionItem, ParticipantItem } from '@/lib/types';

interface SessionCardProps {
  session: SessionItem;
  members: ParticipantItem[];
  savedAlias: string;
  isActive: boolean;
  onJoinOrOpen: (session: SessionItem) => void;
}

export default function SessionCard({
  session,
  members,
  savedAlias,
  isActive,
  onJoinOrOpen,
}: SessionCardProps) {
  const cat = CATEGORIES[session.tag] || CATEGORIES.all;
  const filled = members.length;
  const isFull = filled >= session.maxSpots;
  const isJoined = members.some((p) => p.alias === savedAlias);

  return (
    <div
      style={{
        background: '#111827',
        border: isActive ? '1px solid #6366f1' : '1px solid #1e293b',
        borderRadius: 14,
        padding: 18,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span
            style={{
              padding: '3px 10px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              color: cat.color,
              background: cat.bg,
            }}
          >
            #{session.tag}
          </span>
          <span style={{ fontSize: 12, color: '#64748b' }}>Hosted by @{session.hostAlias}</span>
        </div>

        <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600, color: '#f8fafc' }}>
          {session.title}
        </h3>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 13, color: '#94a3b8' }}>
          <span>Location: {session.location}</span>
          <span>Time: {session.startsAt}</span>
          <span
            style={{
              color: isFull && !isJoined ? '#f87171' : '#34d399',
              fontWeight: 600,
            }}
          >
            {filled}/{session.maxSpots} spots filled
          </span>
        </div>
      </div>

      <button
        onClick={() => onJoinOrOpen(session)}
        disabled={isFull && !isJoined}
        style={{
          flexShrink: 0,
          padding: '9px 16px',
          borderRadius: 9,
          border: 'none',
          fontWeight: 600,
          fontSize: 13,
          cursor: isFull && !isJoined ? 'not-allowed' : 'pointer',
          background: isJoined ? '#1e293b' : isFull ? '#1e293b' : '#10b981',
          color: isJoined ? '#a5b4fc' : isFull ? '#64748b' : '#052e16',
        }}
      >
        {isJoined ? 'Open Room' : isFull ? 'Full' : 'Join Spot'}
      </button>
    </div>
  );
}
