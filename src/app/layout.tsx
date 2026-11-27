import type { Metadata } from 'next';
import '@aws-amplify/ui-react/styles.css';

export const metadata: Metadata = {
  title: 'CampusCrew — Verified Campus Activity Board',
  description: 'Find verified campus peers for sports, music, dance, art, and gaming.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style>{`
          *, *::before, *::after { box-sizing: border-box; }
          body {
            margin: 0;
            font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: #090d16;
            color: #f1f5f9;
            -webkit-font-smoothing: antialiased;
          }
          input, select, button {
            font-family: inherit;
          }
          input:focus, select:focus {
            outline: 2px solid #6366f1;
            outline-offset: -1px;
          }
          /* Clean up Amplify Authenticator card to match dark theme */
          [data-amplify-authenticator] {
            --amplify-colors-background-primary: #111827;
            --amplify-colors-background-secondary: #090d16;
            --amplify-colors-font-primary: #f1f5f9;
            --amplify-colors-font-secondary: #94a3b8;
            --amplify-colors-brand-primary-80: #6366f1;
            --amplify-colors-brand-primary-90: #4f46e5;
            --amplify-colors-brand-primary-100: #4338ca;
            --amplify-colors-border-primary: #1e293b;
            margin-top: 48px;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
