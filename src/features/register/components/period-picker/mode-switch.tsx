import { SegmentedControl } from '@/components/ui/segmented-control';
import { periodCopy } from '../../copy';
import { periodModes, type PeriodMode } from '../../model/period';

interface ModeSwitchProps {
  mode: PeriodMode;
  onMode: (mode: PeriodMode) => void;
  className?: string;
}

/** The period kinds: month, quarter, year and range. */
export function ModeSwitch({ mode, onMode, className }: ModeSwitchProps) {
  return (
    <SegmentedControl
      label={periodCopy.modes}
      options={periodModes.map(({ mode: value, label }) => ({ value, label }))}
      value={mode}
      onChange={onMode}
      className={className}
    />
  );
}
