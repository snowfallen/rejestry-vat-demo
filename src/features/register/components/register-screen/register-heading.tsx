import { organization } from '@/features/workspace';
import { cx } from '@/lib/cx';
import { registerCopy } from '../../copy';

/** Id of the page title; the sticky header takes it over once it scrolls away. */
export const registerHeadingId = 'register-title';

/**
 * Organisation, title and subtitle. Nothing here reacts to input, so it stays a server
 * component: the page renders it and hands it to the interactive screen. Its parts are
 * cells of `RegisterTitle`'s grid.
 */
export function RegisterHeading() {
  return (
    <>
      <p
        className={cx(
          'col-start-1 row-start-1 m-0 mb-1 truncate text-[13px] font-semibold text-accent',
          'phone:col-span-2 phone:mb-0 phone:text-[12px]',
        )}
      >
        {organization}
      </p>
      <h1
        id={registerHeadingId}
        className={cx(
          'col-span-1 col-start-1 row-start-2 m-0 text-[clamp(24px,0.9vw+19px,30px)] font-[620]',
          'leading-[1.15] tracking-[-0.035em] text-ink',
          'phone:col-span-2 phone:text-[30px] phone:font-[680] phone:tracking-[-0.04em]',
        )}
      >
        {registerCopy.title}
      </h1>
      <p
        className={cx(
          'col-span-2 row-start-3 m-0 mt-1.5 text-[14px] leading-snug text-muted',
          // Phones keep the first screen for the period and the register; the capsule
          // below already says the data is a demo.
          'phone:hidden',
        )}
      >
        {registerCopy.subtitle}
      </p>
    </>
  );
}
