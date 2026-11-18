import type { MetadataRoute } from 'next';
import { appCopy } from './copy';

// Added to a phone's home screen, the register opens like an app. Colours mirror the
// light theme's canvas and header.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Rejestry i VAT',
    short_name: appCopy.shortName,
    description: appCopy.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#f6f7fb',
    theme_color: '#ffffff',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  };
}
