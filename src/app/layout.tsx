import type { Metadata } from 'next';
import '@aws-amplify/ui-react/styles.css';

export const metadata: Metadata = {
  title: 'CampusCrew — Campus Interest & Activity Board',
  description: 'Connect with verified peers on your campus for sports, music, dance, art, and gaming.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#0f172a', color: '#f8fafc' }}>
        {children}
      </body>
    </html>
  );
}
