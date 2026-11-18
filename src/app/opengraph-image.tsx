import { ImageResponse } from 'next/og';
import { appCopy } from './copy';

export const alt = appCopy.ogAlt;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// The demo year's shape in whole złoty, output VAT over input VAT per month (December
// has not begun). ImageResponse cannot read CSS tokens: colours mirror the light theme.
const year = [
  [2555, 1314],
  [3013, 1280],
  [2478, 1403],
  [3752, 1618],
  [2979, 1566],
  [3671, 4079],
  [2386, 1175],
  [1905, 992],
  [2788, 1398],
  [2323, 1338],
  [1901, 717],
  [0, 0],
];
const scale = 150 / 4100;
const ink = '#17262e';
const muted = '#5b6b75';
const accent = '#167873';

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        padding: 56,
        background: '#f6f7fb',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 56px',
          borderRadius: 32,
          background: '#ffffff',
          boxShadow: '0 1px 2px rgba(23, 38, 46, 0.08)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              width: 88,
              height: 88,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 20,
              background: accent,
            }}
          >
            <svg
              width="54"
              height="54"
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
          </div>
          <div style={{ marginTop: 36, fontSize: 66, color: ink }}>{appCopy.ogTitle}</div>
          <div style={{ marginTop: 8, fontSize: 34, color: muted }}>{appCopy.ogLine}</div>
          <div style={{ marginTop: 28, fontSize: 24, color: accent }}>{appCopy.ogNote}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {year.map(([output, input], i) => (
            <div
              key={i}
              style={{
                width: 26,
                height: 320,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 14,
                background: i === 9 ? '#eaf5f3' : 'transparent',
                border: i === 9 ? `2px solid ${accent}` : '2px solid transparent',
              }}
            >
              <div
                style={{
                  width: 14,
                  height: Math.max(output * scale, 2),
                  borderRadius: '6px 6px 0 0',
                  background: output ? accent : '#d6dde1',
                }}
              />
              <div style={{ width: 20, height: 2, background: '#d6dde1' }} />
              <div
                style={{
                  width: 14,
                  height: Math.max(input * scale, 2),
                  borderRadius: '0 0 6px 6px',
                  background: input > output ? '#d4a64a' : '#c9d3d8',
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>,
    size,
  );
}
