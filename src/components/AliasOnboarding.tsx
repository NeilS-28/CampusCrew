'use client';

import { useState } from 'react';
import { client } from '@/lib/amplify';

interface AliasOnboardingProps {
  user?: { userId?: string; signInDetails?: { loginId?: string } };
  initialAlias?: string;
  profileId?: string | null;
  onAliasSaved: (alias: string, profileId?: string) => void;
  onCancel?: () => void;
}

export default function AliasOnboarding({
  user,
  initialAlias = '',
  profileId = null,
  onAliasSaved,
  onCancel,
}: AliasOnboardingProps) {
  const [aliasInput, setAliasInput] = useState(initialAlias);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = Boolean(initialAlias && onCancel);

  const handleSaveAlias = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = aliasInput.trim().replace(/^@+/, '');
    if (!cleaned) return;
    if (isEditing && cleaned === initialAlias) {
      onCancel?.();
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const { data: existing } = await client.models.Profile.list();
      const isOwnedByMe = (p: { owner?: string | null }) =>
        Boolean(user?.userId && p.owner?.startsWith(user.userId));

      const taken = existing.some(
        (p) =>
          p.id !== profileId &&
          !isOwnedByMe(p as { owner?: string | null }) &&
          p.alias.toLowerCase() === cleaned.toLowerCase()
      );
      if (taken) {
        setError('This alias is already taken. Try another one.');
        return;
      }

      const myProfiles = existing.filter((p) => isOwnedByMe(p as { owner?: string | null }));
      const targetId = profileId || myProfiles[0]?.id || null;

      let savedId = targetId || undefined;
      if (targetId) {
        await client.models.Profile.update({ id: targetId, alias: cleaned });
        // Clean up any duplicate profiles left over for this user
        const duplicates = myProfiles.filter((p) => p.id !== targetId);
        if (duplicates.length > 0) {
          await Promise.allSettled(
            duplicates.map((d) => client.models.Profile.delete({ id: d.id }))
          );
        }
      } else {
        const { data: created } = await client.models.Profile.create({
          alias: cleaned,
          interests: ['badminton'],
        });
        savedId = created?.id;
      }

      localStorage.setItem(`campus_alias_${user?.userId || 'default'}`, cleaned);
      onAliasSaved(cleaned, savedId);
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
        <h2 style={{ margin: '8px 0 6px', fontSize: 22 }}>
          {isEditing ? 'Change your campus alias' : 'Choose your campus alias'}
        </h2>
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
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: 10,
                background: 'transparent',
                color: '#94a3b8',
                border: '1px solid #334155',
                fontWeight: 600,
                fontSize: 15,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            style={{
              flex: 1,
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
            {submitting ? 'Saving...' : isEditing ? 'Save Alias' : 'Enter Campus Board'}
          </button>
        </div>
      </form>
    </div>
  );
}
