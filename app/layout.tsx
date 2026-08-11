import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'SoftWalk | Summer Comfort Sandals', description: 'Lightweight comfort, delivered with Cash on Delivery.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
