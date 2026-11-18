import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import '@fontsource-variable/geist';
import { bootScript } from '@/lib/boot-scripts';
import { headerColor } from '@/lib/theme-colors';
import './globals.css';
import { appCopy } from './copy';

// Absolute links for the share card: the production domain on Vercel, the dev server elsewhere.
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : 'http://127.0.0.1:3100';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Rejestry i VAT | Onsaldo',
  description: appCopy.description,
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: appCopy.shortName, statusBarStyle: 'default' },
};
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: headerColor.light },
    { media: '(prefers-color-scheme: dark)', color: headerColor.dark },
  ],
};
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // The request's CSP nonce (see proxy.ts). Next puts it on its own scripts; the theme
  // script needs it by hand. Browsers hide a nonce after parsing, hence the warning off.
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  return (
    <html lang="pl" suppressHydrationWarning>
      <head>
        <script
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: bootScript }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
