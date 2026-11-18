import Link from 'next/link';
import { appCopy } from './copy';
export default function NotFound() {
  return (
    <main className="fallback">
      <h1>{appCopy.notFound.title}</h1>
      <p>{appCopy.notFound.text}</p>
      <Link href="/">{appCopy.notFound.back}</Link>
    </main>
  );
}
