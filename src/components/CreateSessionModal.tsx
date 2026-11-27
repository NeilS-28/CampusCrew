'use client';

import { useState } from 'react';
import { CATEGORIES } from '@/lib/constants';
import { client } from '@/lib/amplify';

interface CreateSessionModalProps {
  savedAlias: string;
  onClose: () => void;
  onSessionCreated: (sessionId: string) => void;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

export default function CreateSessionModal({
  savedAlias,
  onClose,
  onSessionCreated,
  onError,
  onSuccess,
}: CreateSessionModalProps) {
  const [title, setTitle] = useState('');
  const [tag, setTag] = useState('badminton');
  const [location, setLocation] = useState('');
  const [startsAt, setStartsAt] = useState('Today, 6:00 PM');
  const [maxSpots, setMaxSpots] = useState(4);
  const [submitting, setSubmitting] = useState(false);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !location.trim()) return;
    setSubmitting(true);
    try {
      const { data: created, errors } = await client.models.Session.create({
        title: title.trim(),
        tag: tag.trim().toLowerCase() || 'general',
        location: location.trim(),
        startsAt: startsAt.trim() || 'Today',
        maxSpots: Math.max(2, Math.min(30, Number(maxSpots))),
        hostAlias: savedAlias,
      });
      if (errors?.length) {
        onError('Failed to create session. Please try again.');
        return;
      }
      if (created) {
        await client.models.Participant.create({
          sessionId: created.id,
          alias: savedAlias,
        });
        onSessionCreated(created.id);
      }
      onSuccess('Session posted!');
      onClose();
    } catch (err) {
      console.error('Error creating session:', err);
      onError('Failed to create session. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 40,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'grid',
        placeItems: 'center',
        padding: 16,
      }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleCreateSession}
        style={{
          width: '100%',
          maxWidth: 460,
          background: '#111827',
          border: '1px solid #1e293b',
          borderRadius: 16,
          padding: 24,
          display: 'grid',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 18 }}>Post a Live Activity</h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: 18,
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
            Activity Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Need 2 players for badminton doubles"
            required
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 9,
              border: '1px solid #334155',
              background: '#090d16',
              color: '#f1f5f9',
              fontSize: 14,
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
              Category
            </label>
            <input
              list="category-suggestions"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="e.g. badminton, chess, study"
              maxLength={24}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 9,
                border: '1px solid #334155',
                background: '#090d16',
                color: '#f1f5f9',
                fontSize: 14,
              }}
            />
            <datalist id="category-suggestions">
              {Object.entries(CATEGORIES)
                .filter(([k]) => k !== 'all')
                .map(([k, meta]) => (
                  <option key={k} value={k}>
                    {meta.label}
                  </option>
                ))}
            </datalist>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
              Total Spots
            </label>
            <input
              type="number"
              min={2}
              max={30}
              value={maxSpots}
              onChange={(e) => setMaxSpots(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 9,
                border: '1px solid #334155',
                background: '#090d16',
                color: '#f1f5f9',
                fontSize: 14,
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
              Location
            </label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Indoor Court 2"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 9,
                border: '1px solid #334155',
                background: '#090d16',
                color: '#f1f5f9',
                fontSize: 14,
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
              Time
            </label>
            <input
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              placeholder="e.g. Today, 6:00 PM"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 9,
                border: '1px solid #334155',
                background: '#090d16',
                color: '#f1f5f9',
                fontSize: 14,
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          style={{
            marginTop: 4,
            padding: '11px 16px',
            borderRadius: 10,
            background: submitting ? '#4f46e5' : '#6366f1',
            color: '#fff',
            border: 'none',
            fontWeight: 600,
            fontSize: 14,
            cursor: submitting ? 'wait' : 'pointer',
          }}
        >
          {submitting ? 'Posting...' : 'Publish Session'}
        </button>
      </form>
    </div>
  );
}
