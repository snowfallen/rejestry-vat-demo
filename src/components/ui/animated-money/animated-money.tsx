'use client';
import { useCountUp } from '@/hooks/use-count-up';
import { formatMoney } from '@/lib/format';

interface AnimatedMoneyProps {
  value: number;
  unavailable?: boolean;
}

/**
 * An amount that counts to its new value, so a change of context is visible. The
 * first render shows the value itself: the server's frame must already be true.
 */
export function AnimatedMoney({ value, unavailable = false }: AnimatedMoneyProps) {
  const shown = useCountUp(value);
  return <>{unavailable ? '—' : formatMoney(shown)}</>;
}
