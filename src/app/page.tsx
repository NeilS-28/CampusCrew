'use client';

import { useEffect, useMemo, useState } from 'react';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import outputs from '../../amplify_outputs.json';

Amplify.configure(outputs);
const client = generateClient<Schema>();

const CATEGORIES: Record<string, { label: string; color: string; bg: string }> = {
  all: { label: 'All Activities', color: '#e2e8f0', bg: '#1e293b' },
  badminton: { label: 'Badminton & Sports', color: '#34d399', bg: 'rgba(16, 185, 129, 0.14)' },
  music: { label: 'Music & Jam', color: '#a78bfa', bg: 'rgba(139, 92, 246, 0.14)' },
  dance: { label: 'Dance', color: '#f472b6', bg: 'rgba(236, 72, 153, 0.14)' },
  art: { label: 'Art & Sketching', color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.14)' },
  gaming: { label: 'Gaming', color: '#38bdf8', bg: 'rgba(14, 165, 233, 0.14)' },
};

type SessionItem = Schema['Session']['type'];
type ParticipantItem = Schema['Participant']['type'];
type MessageItem = Schema['Message']['type'];

function CampusBoard({
  signOut,
  user,
}: {
  signOut?: () => void;
  user?: { userId?: string; signInDetails?: { loginId?: string } };
}) {
  const [profileLoading, setProfileLoading] = useState(true);
  const [aliasInput, setAliasInput] = useState('');
  const [savedAlias, setSavedAlias] = useState('');

  const [selectedTag, setSelectedTag] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [participants, setParticipants] = useState<ParticipantItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);

  // Form & Room inputs
  const [title, setTitle] = useState('');
  const [tag, setTag] = useState('badminton');
  const [location, setLocation] = useState('');
  const [startsAt, setStartsAt] = useState('Today, 6:00 PM');
  const [maxSpots, setMaxSpots] = useState(4);
  const [submitting, setSubmitting] = useState(false);

  const [chatInput, setChatInput] = useState('');
  const [handleInput, setHandleInput] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Load user's saved alias from DynamoDB Profile (fallback to localStorage cache)
  useEffect(() => {
    let mounted = true;
    async function loadProfile() {
      try {
        const cached = localStorage.getItem(`campus_alias_${user?.userId || 'default'}`);
        if (cached && mounted) {
          setSavedAlias(cached);
          setProfileLoading(false);
          return;
        }
        const { data } = await client.models.Profile.list();
        // Match profile owned by current user if owner field is present
        const mine = data.find((p) => (p as { owner?: string }).owner?.startsWith(user?.userId || '__none__'));
        if (mine && mounted) {
          setSavedAlias(mine.alias);
          localStorage.setItem(`campus_alias_${user?.userId || 'default'}`, mine.alias);
        }
      } finally {
        if (mounted) setProfileLoading(false);
      }
    }
    loadProfile();
    return () => {
      mounted = false;
    };
  }, [user?.userId]);

  // Real-time Sessions & Participants subscriptions
  useEffect(() => {
    const subSessions = client.models.Session.observeQuery().subscribe({
      next: ({ items }) => setSessions([...items]),
    });
    const subParticipants = client.models.Participant.observeQuery().subscribe({
      next: ({ items }) => setParticipants([...items]),
    });
    return () => {
      subSessions.unsubscribe();
      subParticipants.unsubscribe();
    };
  }, []);

  // Real-time Messages for active room
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }
    const sub = client.models.Message.observeQuery({
      filter: { sessionId: { eq: activeSessionId } },
    }).subscribe({
      next: ({ items }) => {
        const sorted = [...items].sort((a, b) =>
          (a.createdAt || '').localeCompare(b.createdAt || '')
        );
        setMessages(sorted);
      },
    });
    return () => sub.unsubscribe();
  }, [activeSessionId]);

  const handleSaveAlias = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = aliasInput.trim().replace(/^@+/, '');
    if (!cleaned) return;
    setSubmitting(true);
    try {
      await client.models.Profile.create({ alias: cleaned, interests: ['badminton'] });
      localStorage.setItem(`campus_alias_${user?.userId || 'default'}`, cleaned);
      setSavedAlias(cleaned);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !location.trim()) return;
    setSubmitting(true);
    try {
      const { data: created } = await client.models.Session.create({
        title: title.trim(),
        tag,
        location: location.trim(),
        startsAt: startsAt.trim() || 'Today',
        maxSpots: Math.max(2, Math.min(30, Number(maxSpots))),
        hostAlias: savedAlias,
      });
      if (created) {
        await client.models.Participant.create({
          sessionId: created.id,
          alias: savedAlias,
        });
        setActiveSessionId(created.id);
      }
      setTitle('');
      setLocation('');
      setShowCreateModal(false);
      notify('Session posted!');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinOrOpen = async (session: SessionItem) => {
    const sessionMembers = participants.filter((p) => p.sessionId === session.id);
    const alreadyJoined = sessionMembers.some((p) => p.alias === savedAlias);

    if (alreadyJoined) {
      setActiveSessionId(session.id);
      return;
    }

    if (sessionMembers.length >= session.maxSpots) {
      notify('This session is already full.');
      return;
    }

    await client.models.Participant.create({
      sessionId: session.id,
      alias: savedAlias,
    });
    setActiveSessionId(session.id);
    notify('Spot claimed!');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeSessionId) return;
    const text = chatInput.trim();
    setChatInput('');
    await client.models.Message.create({
      sessionId: activeSessionId,
      senderAlias: savedAlias,
      body: text,
    });
  };

  const handleShareHandle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handleInput.trim() || !activeSessionId) return;
    const myParticipant = participants.find(
      (p) => p.sessionId === activeSessionId && p.alias === savedAlias
    );
    if (!myParticipant) return;
    await client.models.Participant.update({
      id: myParticipant.id,
      revealedHandle: handleInput.trim(),
    });
    setHandleInput('');
    notify('Handle shared with this room.');
  };

  const filteredSessions = useMemo(() => {
    return sessions
      .filter((s) => (selectedTag === 'all' ? true : s.tag === selectedTag))
      .filter((s) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          s.title.toLowerCase().includes(q) ||
          s.location.toLowerCase().includes(q) ||
          s.hostAlias.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [sessions, selectedTag, searchQuery]);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;
  const activeMembers = activeSession
    ? participants.filter((p) => p.sessionId === activeSession.id)
    : [];

  if (profileLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#94a3b8' }}>
        Loading CampusCrew...
      </div>
    );
  }

  // Onboarding Alias Card
  if (!savedAlias) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 20 }}>
        <form
          onSubmit={handleSaveAlias}
          style={{
            width: '100%',
            maxWidth: 420,
            background: '#111827',
            border: '1px solid #1e293b',
            borderRadius: 16,
            padding: 28,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: '#818cf8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Verified Student Access
          </div>
          <h2 style={{ margin: '8px 0 6px', fontSize: 22 }}>Choose your campus alias</h2>
          <p style={{ margin: '0 0 20px', color: '#94a3b8', fontSize: 14, lineHeight: 1.5 }}>
            Signed in as <strong style={{ color: '#e2e8f0' }}>{user?.signInDetails?.loginId}</strong>. Your real identity stays hidden until you choose to reveal your handle inside a session.
          </p>
          <input
            value={aliasInput}
            onChange={(e) => setAliasInput(e.target.value)}
            placeholder="e.g. NightOwl_24"
            maxLength={24}
            required
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 10,
              border: '1px solid #334155',
              background: '#090d16',
              color: '#f8fafc',
              fontSize: 15,
            }}
          />
          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: 14,
              width: '100%',
              padding: '12px 16px',
              borderRadius: 10,
              background: '#6366f1',
              color: '#fff',
              border: 'none',
              fontWeight: 600,
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            {submitting ? 'Saving...' : 'Enter Campus Board'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 50,
            background: '#1e293b',
            border: '1px solid #6366f1',
            color: '#f8fafc',
            padding: '10px 16px',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          {toast}
        </div>
      )}

      {/* Top Navigation Bar */}
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
              onClick={() => setShowCreateModal(true)}
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

      {/* Main Content Area */}
      <main
        style={{
          maxWidth: 1120,
          width: '100%',
          margin: '0 auto',
          padding: '24px 20px 60px',
          display: 'grid',
          gridTemplateColumns: activeSession ? 'minmax(0, 1.3fr) minmax(320px, 1fr)' : '1fr',
          gap: 24,
          alignItems: 'start',
        }}
      >
        {/* Left Column: Filters & Live Activity Feed */}
        <div>
          {/* Search + Category Pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
              {Object.entries(CATEGORIES).map(([key, meta]) => {
                const active = selectedTag === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedTag(key)}
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
                    {meta.label}
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
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>No live sessions here yet</div>
              <div style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>
                Start a badminton match, jam session, or gaming lobby for your campus.
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
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
              {filteredSessions.map((session) => {
                const cat = CATEGORIES[session.tag] || CATEGORIES.all;
                const members = participants.filter((p) => p.sessionId === session.id);
                const filled = members.length;
                const isFull = filled >= session.maxSpots;
                const isJoined = members.some((p) => p.alias === savedAlias);
                const isSelected = activeSessionId === session.id;

                return (
                  <div
                    key={session.id}
                    style={{
                      background: '#111827',
                      border: isSelected ? '1px solid #6366f1' : '1px solid #1e293b',
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
                        <span style={{ fontSize: 12, color: '#64748b' }}>
                          Hosted by @{session.hostAlias}
                        </span>
                      </div>

                      <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600, color: '#f8fafc' }}>
                        {session.title}
                      </h3>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 13, color: '#94a3b8' }}>
                        <span>Location: {session.location}</span>
                        <span>Time: {session.startsAt}</span>
                        <span style={{ color: isFull && !isJoined ? '#f87171' : '#34d399', fontWeight: 600 }}>
                          {filled}/{session.maxSpots} spots filled
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleJoinOrOpen(session)}
                      disabled={isFull && !isJoined}
                      style={{
                        flexShrink: 0,
                        padding: '9px 16px',
                        borderRadius: 9,
                        border: 'none',
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: isFull && !isJoined ? 'not-allowed' : 'pointer',
                        background: isJoined
                          ? '#1e293b'
                          : isFull
                          ? '#1e293b'
                          : '#10b981',
                        color: isJoined ? '#a5b4fc' : isFull
