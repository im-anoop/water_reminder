import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { manifest: '/manifest.webmanifest', appleWebApp: { capable: true, title: 'Hydrate' }, icons: { apple: '/icon-192.png' }, title: 'Hydrate — Water Reminder', description: 'Build a healthy hydration habit.' };
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body>{children}</body></html>; }
