import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cssVars } from '@/lib/css-vars';
import { cx } from '@/lib/cx';
import k from './ksef-steps.module.css';

/** One step of the document's way through KSeF; done steps fill their connector. */
export function Step({
  done,
  index,
  label,
  detail,
  mono = false,
}: {
  done: boolean;
  index: number;
  label: string;
  detail: ReactNode;
  mono?: boolean;
}) {
  return (
    <li className={cx(done && k.done)} style={cssVars({ '--i': index })}>
      <span className={k.mark}>{done && <Check size={11} strokeWidth={3} />}</span>
      {label}
      <small className={cx(mono && k.mono)}>{detail}</small>
    </li>
  );
}
