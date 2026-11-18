import type { ReactNode } from 'react';
import { cx } from '@/lib/cx';
import type { DemoState } from '../../model/types';
import { ContextCapsule } from '../context-capsule';

/**
 * The page title (`RegisterHeading`) with the context capsule. Desktop sets the capsule
 * at the title's right; phones give the title the whole width and the capsule its own
 * line under the subtitle, all centred on the axis of the hero below.
 */
export function RegisterTitle({
  heading,
  demo,
  loading,
  onDemo,
  onOpenMap,
}: {
  /** `RegisterHeading`, rendered on the server. */
  heading: ReactNode;
  demo: DemoState;
  loading: boolean;
  onDemo: (next: DemoState) => void;
  onOpenMap: () => void;
}) {
  return (
    <div
      data-intro-part="title"
      className={cx(
        'mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-x-4',
        'phone:mb-3.5 phone:items-center phone:gap-y-1 phone:text-center',
      )}
    >
      {heading}
      <div
        data-tour="demo"
        className={cx(
          'col-span-2 col-start-1 row-start-4 mt-3',
          'phone:mt-2 phone:justify-self-center',
          'min-[900px]:col-span-1 min-[900px]:col-start-2 min-[900px]:row-span-2',
          'min-[900px]:row-start-1 min-[900px]:mt-0',
        )}
      >
        <ContextCapsule state={demo} disabled={loading} onState={onDemo} onOpenMap={onOpenMap} />
      </div>
    </div>
  );
}
