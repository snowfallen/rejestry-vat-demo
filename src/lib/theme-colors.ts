// The browser bar's colour per theme. The meta tag cannot read CSS variables, so these
// mirror each theme's --surface (the app header's background).

export const headerColor = { light: '#ffffff', dark: '#161d25' } as const;

/** Paints the browser bar (theme-color meta tags) for the theme the page shows. */
export function paintBrowserBar(theme: keyof typeof headerColor) {
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((meta) => meta.setAttribute('content', headerColor[theme]));
}
