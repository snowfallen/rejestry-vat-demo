import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

// ImageResponse cannot read CSS tokens: the colours mirror the light theme's --accent
// and the logo's ReceiptText glyph. iOS rounds the corners itself.
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#167873',
      }}
    >
      <svg
        width="108"
        height="108"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
        <path d="M14 8H8" />
        <path d="M16 12H8" />
        <path d="M13 16H8" />
      </svg>
    </div>,
    size,
  );
}
