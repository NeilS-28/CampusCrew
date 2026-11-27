'use client';

import { useEffect, useState } from 'react';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import outputs from '../../amplify_outputs.json';

Amplify.configure(outputs);
const client = generateClient<Schema>();

const TAGS = ['all', 'badminton', 'music', 'dance', 'art', 'gaming'];

function CampusBoard({ signOut, user }: { signOut?: () => void; user?: { signInDetails?: { loginId?: string } } }) {
  const [alias, setAlias] = useState('');
  const [savedAlias, setSavedAlias] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [sessions, setSessions] = useState<Schema['Session']['type'][]>([]);
  const [activeSession, setActiveSession] = useState<Schema['Session']['type'] | null>(null);
  const [messages, setMessages] = useState<Schema['Message']['type'][]>([]);
  const [chatInput, setChatInput] = useState('');

  // Form states for new session
  const [title, setTitle] = useState('');
  const [tag, setTag] = useState('badminton');
  const [location, setLocation] = useState('');
  const [startsAt, setStartsAt] = useState('Today, 6:00 PM');
  const [maxSpots, setMaxSpots] = useState(4);

  useEffect(() => {
    const stored = localStorage.getItem('campus_alias');
    if (stored) setSavedAlias(stored);

    const sub = client.models.Session.observeQuery().subscribe({
      next: ({ items }) => setSessions([...items]),
    });
    return () => sub.unsubscribe();
  }, []);

  useEffect(() => {
    if (!activeSession) return;
    const sub = client.models.Message.observeQuery({
      filter: { sessionId: { eq: activeSession.id } },
    }).subscribe({
      next: ({ items }) => setMessages([...items]),
    });
    return () => sub.unsubscribe();
  }, [activeSession]);

  const handleSaveAlias = async () => {
    if (!alias.trim()) return;
    await client.models.Profile.create({ alias: alias.trim(), interests: [tag] });
    localStorage.setItem('campus_alias', alias.trim());
    setSavedAlias(alias.trim());
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !location.trim()) return;
    await client.models.Session.create({
      title: title.trim(),
      tag,
      location: location.trim(),
      startsAt,
      maxSpots: Number(maxSpots),
      hostAlias: savedAlias,
    });
    setTitle('');
    setLocation('');
  };

  const handleJoinSession = async (session: Schema['Session']['type']) => {
    await client.models.Participant.create({
      sessionId: session.id,
      alias: savedAlias,
    });
    setActiveSession(session);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeSession) return;
    await client.models.Message.create({
      sessionId: activeSession.id,
      senderAlias: savedAlias,
      body: chatInput.trim(),
    });
    setChatInput('');
  };

  if (!savedAlias) {
    return (
      <div style={{ maxWidth: 420, margin: '80px auto', padding: 24, background: '#1e293b', borderRadius: 12 }}>
        <h2>Pick Your Campus Alias</h2>
        <p style={{ color: '#94a3b8', fontSize: 14 }}>
          Verified via {user?.signInDetails?.loginId}. Stay pseudonymous until you choose to share your handle.
        </p>
        <input
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          placeholder="e.g. NightOwl_24"
          style={{ width: '100%', padding: 10, marginTop: 12, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#fff' }}
        />
        <button
          onClick={handleSaveAlias}
          style={{ marginTop: 14, width: '100%', padding: 10, borderRadius: 8, background: '#6366f1', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}
        >
          Enter Campus Board
        </button>
      </div>
    );
  }

  const filtered = selectedTag === 'all' ? sessions : sessions.filter((s) => s.tag === selectedTag);

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: 24 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0 }}>CampusCrew</h1>
          <span style={{ color: '#94a3b8', fontSize: 14 }}>Signed in as @{savedAlias}</span>
        </div>
        <button onClick={signOut} style={{ padding: '8px 14px', borderRadius: 8, background: '#334155', color: '#fff', border: 'none', cursor: 'pointer' }}>
          Sign Out
        </button>
      </header>

      {/* Post New Activity */}
      <form onSubmit={handleCreateSession} style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 24, display: 'grid', gap: 10 }}>
        <strong>Post a Live Activity Session</strong>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Need 2 players for badminton doubles"
          required
          style={{ padding: 10, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#fff' }}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 90px', gap: 8 }}>
          <select value={tag} onChange={(e) => setTag(e.target.value)} style={{ padding: 10, borderRadius: 8, background: '#0f172a', color: '#fff', border: '1px solid #334155' }}>
            {TAGS.filter((t) => t !== 'all').map((t) => (
              <option key={t} value={t}>#{t}</option>
            ))}
          </select>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location (e.g. Court 2)"
            required
            style={{ padding: 10, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#fff' }}
          />
          <input
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            placeholder="Time"
            style={{ padding: 10, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#fff' }}
          />
          <input
            type="number"
            min={2}
            max={20}
            value={maxSpots}
            onChange={(e) => setMaxSpots(Number(e.target.value))}
            style={{ padding: 10, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#fff' }}
          />
        </div>
        <button type="submit" style={{ padding: 10, borderRadius: 8, background: '#6366f1', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
          Post Session
        </button>
      </form>

      {/* Filter Pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {TAGS.map((t) => (
          <button
            key={t}
            onClick={() => setSelectedTag(t)}
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              background: selectedTag === t ? '#6366f1' : '#1e293b',
              color: '#fff',
            }}
          >
            {t === 'all' ? 'All' : `#${t}`}
          </button>
        ))}
      </div>

      {/* Live Feed */}
      <div style={{ display: 'grid', gap: 12 }}>
        {filtered.map((session) => (
          <div key={session.id} style={{ background: '#1e293b', padding: 16, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 12, color: '#818cf8', fontWeight: 600 }}>#{session.tag}</span>
              <h3 style={{ margin: '4px 0' }}>{session.title}</h3>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>
                📍 {session.location} • 🕒 {session.startsAt} • Hosted by @{session.hostAlias} ({session.maxSpots} spots)
              </div>
            </div>
            <button
              onClick={() => handleJoinSession(session)}
              style={{ padding: '8px 16px', borderRadius: 8, background: '#10b981', color: '#062c1e', fontWeight: 700, border: 'none', cursor: 'pointer' }}
            >
              Join & Chat
            </button>
          </div>
        ))}
      </div>

      {/* Active Session Micro-Chat */}
      {activeSession && (
        <div style={{ marginTop: 24, background: '#1e293b', padding: 16, borderRadius: 12, border: '1px solid #6366f1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <strong>Room: {activeSession.title}</strong>
            <button onClick={() => setActiveSession(null)} style={{ background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer' }}>
              Close
            </button>
          </div>
          <div style={{ maxHeight: 220, overflowY: 'auto', display: 'grid', gap: 8, marginBottom: 12 }}>
            {messages.map((m) => (
              <div key={m.id} style={{ background: '#0f172a', padding: 8, borderRadius: 8, fontSize: 14 }}>
                <strong style={{ color: '#818cf8' }}>@{m.senderAlias}: </strong>
                <span>{m.body}</span>
              </div>
            ))}
          </div>
          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 8 }}>
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Coordinate meetup spot or share handle..."
              style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#fff' }}
            />
            <button type="submit" style={{ padding: '10px 16px', borderRadius: 8, background: '#6366f1', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Authenticator>
      {({ signOut, user }) => <CampusBoard signOut={signOut} user={user} />}
    </Authenticator>
  );
}
