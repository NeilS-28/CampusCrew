'use client';

import { useMemo } from 'react';
import { CATEGORIES } from '@/lib/constants';
import type { SessionItem, ParticipantItem } from '@/lib/types';
import SessionCard from './SessionCard';

interface SessionBoardProps {
  sessions: SessionItem[];
  participants: ParticipantItem[];
  savedAlias: string;
  selectedTag: string;
  searchQuery: string;
  activeSessionId: string | null;
  onSelectTag: (tag: string) => void;
  onSearchChange: (query: string) => void;
  onJoinOrOpen: (session: SessionItem) => void;
  onCreateSession: () => void;
}

export default function SessionBoard({
  sessions,
  participants,
  savedAlias,
  selectedTag,
  searchQuery,
  activeSessionId,
  onSelectTag,
  onSearchChange,
  onJoinOrOpen,
  onCreateSession,
}: SessionBoardProps) {
  const categoryPills = useMemo(() => {
    const pills = Object.entries(CATEGORIES).map(([key, meta]) => ({
      key,
      label: meta.label,
    }));
    const knownKeys = new Set(Object.keys(CATEGORIES));
    const customTags = new Set<string>();
    for (const s of sessions) {
      if (s.tag && !knownKeys.has(s.tag)) {
        customTags.add(s.tag);
      }
    }
    for (const tag of Array.from(customTags).sort()) {
      pills.push({ key: tag, label: `#${tag}` });
    }
    return pills;
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    return sessions
      .filter((s) => (selectedTag === 'all' ? true : s.tag === selectedTag))
      .filter((s) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          s.title.toLowerCase().includes(q) ||
          s.location.toLowerCase().includes(q) ||
          s.hostAlias.toLowerCase().includes(q) ||
          s.tag.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [sessions, selectedTag, searchQuery]);

  return (
    <div>
      {/* Search + Category Pills */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
        <input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search sessions, locations, or hosts..."
          style={{
            width: '100%',
            padding: '11px 14px',
            borderRadius: 10,
            border: '1px solid #1e293b',
            background: '#111827',
            color: '#f1f5f9',
            fontSize: 14,
          }}
        />

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {categoryPills.map(({ key, label }) => {
            const active = selectedTag === key;
            return (
              <button
                key={key}
                onClick={() => onSelectTag(key)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 999,
                  border: active ? '1px solid #6366f1' : '1px solid #1e293b',
                  background: active ? 'rgba(99, 102, 241, 0.18)' : '#111827',
                  color: active ? '#a5b4fc' : '#94a3b8',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Session Cards */}
      {filteredSessions.length === 0 ? (
        <div
          style={{
            background: '#111827',
            border: '1px dashed #1e293b',
            borderRadius: 14,
            padding: '44px 20px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
            No live sessions here yet
          </div>
          <div style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>
            Start a badminton match, jam session, or gaming lobby for your campus.
          </div>
          <button
            onClick={onCreateSession}
            style={{
              padding: '9px 16px',
              borderRadius: 9,
              background: '#6366f1',
              color: '#fff',
              border: 'none',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Post First Session
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {filteredSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              members={participants.filter((p) => p.sessionId === session.id)}
              savedAlias={savedAlias}
              isActive={activeSessionId === session.id}
              onJoinOrOpen={onJoinOrOpen}
            />
          ))}
        </div>
      )}
    </div>
  );
}
