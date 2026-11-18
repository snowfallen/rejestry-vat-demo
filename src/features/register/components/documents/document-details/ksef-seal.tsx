import { cx } from '@/lib/cx';
import { ksefCopy } from '../../../copy';
import s from './ksef-seal.module.css';

/**
 * KSeF status of the document as a seal. When the sheet opens, the confirmed seal
 * draws its tick and sends out one ring; a pending one shows a slowly turning arc.
 * `fresh`: confirmed just now, in the open sheet, so the tick draws again.
 */
export function KsefSeal({ confirmed, fresh = false }: { confirmed: boolean; fresh?: boolean }) {
  return (
    <span className={cx(s.seal, confirmed ? s.sealDone : s.sealPending, fresh && s.sealFresh)}>
      <svg viewBox="0 0 24 24" aria-hidden="true" className={s.sealIcon}>
        <circle cx="12" cy="12" r="10" className={s.sealRing} />
        {confirmed ? (
          <path d="M7.5 12.4l3 3 6-6.6" className={s.sealTick} />
        ) : (
          <path d="M12 7.5V12l3 2" className={s.sealHand} />
        )}
      </svg>
      <span>
        <span className={s.sealLabel}>{ksefCopy.seal}</span>
        {confirmed ? ksefCopy.confirmed : ksefCopy.pending}
      </span>
    </span>
  );
}
