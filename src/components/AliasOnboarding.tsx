'use client';

import { useState } from 'react';
import { client } from '@/lib/amplify';

interface AliasOnboardingProps {
  user?: { userId?: string; signInDetails?: { loginId?: string } };
  onAliasSaved: (alias: string) => void;
}

export default function AliasOnboarding({ user, onAliasSaved }: AliasOnboardingProps) {
  const [aliasInput, setAliasInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSaveAlias = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = aliasInput.trim().replace(/^@+/, '');
    if (!cleaned) return;
    setSubmitting(true);
    setError(null);
    try {
      // Check alias uniqueness
      const { data: existing } = await client.models.Profile.list();
      if (existing.some((p) => p.alias.toLowerCase() === cleaned.toLowerCase())) {
        setError('This alias is already taken. Try another one.');
        return;
      }
      await client.models.Profile.create({ alias: cleaned, interests: ['badminton'] });
      localStorage.setItem(`campus_alias_${user?.userId || 'default'}`, cleaned);
      onAliasSaved(cleaned);
    } catch (err) {
      console.error('Error saving alias:', err);
      setError('Failed to save alias. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#818cf8',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          Verified Student Access
        </div>
        <h2 style={{ margin: '8px 0 6px', fontSize: 22 }}>Choose your campus alias</h2>
        <p style={{ margin: '0 0 20px', color: '#94a3b8', fontSize: 14, lineHeight: 1.5 }}>
          Signed in as <strong style={{ color: '#e2e8f0' }}>{user?.signInDetails?.loginId}</strong>.
          Your real identity stays hidden until you choose to reveal your handle inside a session.
        </p>
        <input
          value={aliasInput}
          onChange={(e) => {
            setAliasInput(e.target.value);
            setError(null);
          }}
          placeholder="e.g. NightOwl_24"
          maxLength={24}
          required
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 10,
            border: `1px solid ${error ? '#f87171' : '#334155'}`,
            background: '#090d16',
            color: '#f8fafc',
            fontSize: 15,
          }}
        />
        {error && <div style={{ marginTop: 8, fontSize: 13, color: '#f87171' }}>{error}</div>}
        <button
          type="submit"
          disabled={submitting}
          style={{
            marginTop: 14,
            width: '100%',
            padding: '12px 16px',
            borderRadius: 10,
            background: submitting ? '#4f46e5' : '#6366f1',
            color: '#fff',
            border: 'none',
            fontWeight: 600,
            fontSize: 15,
            cursor: submitting ? 'wait' : 'pointer',
          }}
        >
          {submitting ? 'Saving...' : 'Enter Campus Board'}
        </button>
      </form>
    </div>
  );
}
