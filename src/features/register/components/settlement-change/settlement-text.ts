import { changeCopy } from '../../copy';
import { monthLocative } from '../../model/period';

export interface SettlementMove {
  percent: number;
  previousMonth: number;
}

export function settlementChangeText({ percent, previousMonth }: SettlementMove): string {
  const when = monthLocative[previousMonth - 1];
  if (percent === 0) return changeCopy.same(when);
  return changeCopy.moved(Math.abs(percent).toLocaleString('pl-PL'), percent < 0, when);
}
