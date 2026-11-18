'use client';
import { appCopy } from './copy';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="fallback">
      <h1>{appCopy.error.title}</h1>
      <p>{appCopy.error.text}</p>
      <button onClick={reset}>{appCopy.error.retry}</button>
    </main>
  );
}
