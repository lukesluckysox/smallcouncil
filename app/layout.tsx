import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Small Council',
    template: '%s | Small Council',
  },
  description:
    'Bring your dilemma before the council. Five voices. Two rounds of debate. One moment of clarity.',
  keywords: ['decision making', 'reflection', 'dilemma', 'advice', 'psychology'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
