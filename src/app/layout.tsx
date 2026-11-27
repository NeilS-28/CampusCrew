import type { Metadata } from 'next';
import '@aws-amplify/ui-react/styles.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'CampusCrew — Verified Campus Activity Board',
  description: 'Find verified campus peers for sports, music, dance, art, and gaming.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
