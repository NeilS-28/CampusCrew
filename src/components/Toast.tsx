'use client';

export default function Toast({ message }: { message: string }) {
  return (
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
      {message}
    </div>
  );
}
