'use client';

import { useState, useEffect, useRef } from 'react';
import type { SessionItem, ParticipantItem, MessageItem } from '@/lib/types';

interface ChatRoomProps {
  session: SessionItem;
  members: ParticipantItem[];
  messages: MessageItem[];
  savedAlias: string;
  onClose: () => void;
  onSendMessage: (text: string) => Promise<void>;
  onShareHandle: (handle: string) => Promise<void>;
  onDeleteSession: (sessionId: string) => Promise<void>;
}

export default function ChatRoom({
  session,
  members,
  messages,
  savedAlias,
  onClose,
  onSendMessage,
  onShareHandle,
  onDeleteSession,
}: ChatRoomProps) {
  const [chatInput, setChatInput] = useState('');
  const [handleInput, setHandleInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isHost = session.hostAlias === savedAlias;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput('');
    await onSendMessage(text);
  };

  const handleSubmitHandle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handleInput.trim()) return;
    const handle = handleInput.trim();
    setHandleInput('');
    await onShareHandle(handle);
  };

  return (
    <aside
      style={{
        position: 'sticky',
        top: 76,
        background: '#111827',
        border: '1px solid #1e293b',
        borderRadius: 14,
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase' }}>
            Session Room
          </div>
          <h3 style={{ margin: '4px 0 0', fontSize: 15 }}>{session.title}</h3>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {isHost && (
            <button
              onClick={async () => {
                setDeleting(true);
                try {
                  await onDeleteSession(session.id);
                } finally {
                  setDeleting(false);
                }
              }}
              disabled={deleting}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 6,
                padding: '4px 9px',
                fontSize: 12,
                fontWeight: 600,
                cursor: deleting ? 'wait' : 'pointer',
              }}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              background: '#1e293b',
              color: '#94a3b8',
              border: 'none',
              borderRadius: 6,
              padding: '4px 9px',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>

      {/* Member Pills & Revealed Handles */}
      <div style={{ background: '#090d16', borderRadius: 10, padding: 10 }}>
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>
          Members ({members.length}/{session.maxSpots})
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {members.map((m) => (
            <span
              key={m.id}
              style={{
                fontSize: 12,
                padding: '4px 9px',
                borderRadius: 999,
                background: '#1e293b',
                color: '#e2e8f0',
              }}
            >
              @{m.alias}
              {m.revealedHandle ? ` (${m.revealedHandle})` : ''}
            </span>
          ))}
        </div>
      </div>

      {/* Optional Handle Reveal */}
      <form onSubmit={handleSubmitHandle} style={{ display: 'flex', gap: 6 }}>
        <input
          value={handleInput}
          onChange={(e) => setHandleInput(e.target.value)}
          placeholder="Optional: share IG / WhatsApp with room"
          style={{
            flex: 1,
            padding: '8px 10px',
            borderRadius: 8,
            border: '1px solid #1e293b',
            background: '#090d16',
            color: '#f1f5f9',
            fontSize: 12,
          }}
        />
        <button
          type="submit"
          style={{
            padding: '8px 11px',
            borderRadius: 8,
            background: '#1e293b',
            color: '#a5b4fc',
            border: 'none',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Reveal
        </button>
      </form>

      {/* Message Feed */}
      <div
        style={{
          height: 250,
          overflowY: 'auto',
          background: '#090d16',
          borderRadius: 10,
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {messages.length === 0 ? (
          <div style={{ margin: 'auto', fontSize: 13, color: '#64748b', textAlign: 'center' }}>
            No messages yet. Coordinate where to meet!
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.senderAlias === savedAlias;
            return (
              <div
                key={m.id}
                style={{
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  background: isMe ? '#312e81' : '#1e293b',
                  padding: '8px 11px',
                  borderRadius: 10,
                  fontSize: 13,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: isMe ? '#c7d2fe' : '#818cf8',
                    marginBottom: 2,
                  }}
                >
                  @{m.senderAlias}
                </div>
                <div style={{ lineHeight: 1.4 }}>{m.body}</div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSubmitMessage} style={{ display: 'flex', gap: 8 }}>
        <input
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Write a message..."
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: 9,
            border: '1px solid #1e293b',
            background: '#090d16',
            color: '#f1f5f9',
            fontSize: 13,
          }}
        />
        <button
          type="submit"
          style={{
            padding: '10px 15px',
            borderRadius: 9,
            background: '#6366f1',
            color: '#fff',
            border: 'none',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Send
        </button>
      </form>
    </aside>
  );
}
