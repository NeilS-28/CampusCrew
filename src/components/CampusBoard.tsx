'use client';

import { useEffect, useState, useCallback } from 'react';
import { client } from '@/lib/amplify';
import type { SessionItem, ParticipantItem, MessageItem } from '@/lib/types';
import Toast from './Toast';
import AliasOnboarding from './AliasOnboarding';
import Navbar from './Navbar';
import SessionBoard from './SessionBoard';
import ChatRoom from './ChatRoom';
import CreateSessionModal from './CreateSessionModal';

interface CampusBoardProps {
  signOut?: () => void;
  user?: { userId?: string; signInDetails?: { loginId?: string } };
}

export default function CampusBoard({ signOut, user }: CampusBoardProps) {
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [savedAlias, setSavedAlias] = useState('');
  const [isEditingAlias, setIsEditingAlias] = useState(false);

  const [selectedTag, setSelectedTag] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [participants, setParticipants] = useState<ParticipantItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);

  const [toast, setToast] = useState<string | null>(null);

  const notify = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Load user's saved alias — use localStorage for instant display, then verify with DB
  useEffect(() => {
    let mounted = true;
    async function loadProfile() {
      try {
        const cached = localStorage.getItem(`campus_alias_${user?.userId || 'default'}`);
        if (cached && mounted) {
          setSavedAlias(cached);
        }
        // Always verify against the database
        const { data } = await client.models.Profile.list();
        const mine = data.find(
          (p) => (p as { owner?: string }).owner?.startsWith(user?.userId || '__none__')
        );
        if (mine && mounted) {
          setProfileId(mine.id);
          setSavedAlias(mine.alias);
          localStorage.setItem(`campus_alias_${user?.userId || 'default'}`, mine.alias);
        } else if (!cached && mounted) {
          setSavedAlias('');
        }
      } catch (err) {
        console.error('Error loading profile:', err);
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

  const handleJoinOrOpen = useCallback(
    async (session: SessionItem) => {
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

      try {
        await client.models.Participant.create({
          sessionId: session.id,
          alias: savedAlias,
        });
        setActiveSessionId(session.id);
        notify('Spot claimed!');
      } catch (err) {
        console.error('Error joining session:', err);
        notify('Failed to join session. Please try again.');
      }
    },
    [participants, savedAlias, notify]
  );

  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!activeSessionId) return;
      try {
        await client.models.Message.create({
          sessionId: activeSessionId,
          senderAlias: savedAlias,
          body: text,
        });
      } catch (err) {
        console.error('Error sending message:', err);
        notify('Failed to send message.');
      }
    },
    [activeSessionId, savedAlias, notify]
  );

  const handleShareHandle = useCallback(
    async (handle: string) => {
      if (!activeSessionId) return;
      const myParticipant = participants.find(
        (p) => p.sessionId === activeSessionId && p.alias === savedAlias
      );
      if (!myParticipant) return;
      try {
        await client.models.Participant.update({
          id: myParticipant.id,
          revealedHandle: handle,
        });
        notify('Handle shared with this room.');
      } catch (err) {
        console.error('Error sharing handle:', err);
        notify('Failed to share handle.');
      }
    },
    [activeSessionId, participants, savedAlias, notify]
  );

  const handleDeleteSession = useCallback(
    async (sessionId: string) => {
      try {
        const roomMembers = participants.filter((p) => p.sessionId === sessionId);
        const roomMessages = activeSessionId === sessionId ? messages : [];

        await Promise.allSettled([
          ...roomMembers.map((m) => client.models.Participant.delete({ id: m.id })),
          ...roomMessages.map((msg) => client.models.Message.delete({ id: msg.id })),
        ]);
        const { errors } = await client.models.Session.delete({ id: sessionId });
        if (errors?.length) {
          console.error('Session delete errors:', errors);
          notify(errors[0]?.message || 'Failed to delete session.');
          return;
        }

        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        setParticipants((prev) => prev.filter((p) => p.sessionId !== sessionId));

        if (activeSessionId === sessionId) {
          setActiveSessionId(null);
        }
        notify('Session deleted.');
      } catch (err) {
        console.error('Error deleting session:', err);
        notify('Failed to delete session.');
      }
    },
    [participants, activeSessionId, messages, notify]
  );

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

  if (!savedAlias || isEditingAlias) {
    return (
      <AliasOnboarding
        user={user}
        initialAlias={savedAlias}
        profileId={profileId}
        onAliasSaved={(alias, newProfileId) => {
          setSavedAlias(alias);
          if (newProfileId) setProfileId(newProfileId);
          setIsEditingAlias(false);
        }}
        onCancel={savedAlias ? () => setIsEditingAlias(false) : undefined}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {toast && <Toast message={toast} />}

      <Navbar
        savedAlias={savedAlias}
        onCreateSession={() => setShowCreateModal(true)}
        onEditAlias={() => setIsEditingAlias(true)}
        signOut={signOut}
      />

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
        <SessionBoard
          sessions={sessions}
          participants={participants}
          savedAlias={savedAlias}
          selectedTag={selectedTag}
          searchQuery={searchQuery}
          activeSessionId={activeSessionId}
          onSelectTag={setSelectedTag}
          onSearchChange={setSearchQuery}
          onJoinOrOpen={handleJoinOrOpen}
          onCreateSession={() => setShowCreateModal(true)}
        />

        {activeSession && (
          <ChatRoom
            session={activeSession}
            members={activeMembers}
            messages={messages}
            savedAlias={savedAlias}
            onClose={() => setActiveSessionId(null)}
            onSendMessage={handleSendMessage}
            onShareHandle={handleShareHandle}
            onDeleteSession={handleDeleteSession}
          />
        )}
      </main>

      {showCreateModal && (
        <CreateSessionModal
          savedAlias={savedAlias}
          onClose={() => setShowCreateModal(false)}
          onSessionCreated={(id) => setActiveSessionId(id)}
          onError={notify}
          onSuccess={notify}
        />
      )}
    </div>
  );
}
