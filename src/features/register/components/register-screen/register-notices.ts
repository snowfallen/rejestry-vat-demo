import { accountingYear, type Notice } from '@/features/workspace';
import { formatDate } from '@/lib/format';
import { documentCount, noticesCopy } from '../../copy';
import { filingDeadline, periodLabel, periodPhrase, type Period } from '../../model/period';

/**
 * What the bell shows: the VAT context, KSeF and the JPK deadline for the selected
 * period, and the accounting year that still needs configuring.
 */
export function registerNotices(
  unconfirmed: { sales: number; purchases: number },
  period: Period,
): Notice[] {
  const deadline = filingDeadline(period);
  const total = unconfirmed.sales + unconfirmed.purchases;
  return [
    {
      icon: 'context',
      action: 'context',
      title: noticesCopy.contextTitle,
      text: noticesCopy.contextText,
    },
    ...(total
      ? [
          {
            icon: 'ksef' as const,
            action: 'ksef' as const,
            title: noticesCopy.ksefTitle(documentCount(total)),
            text: noticesCopy.ksefText(
              periodLabel(period),
              unconfirmed.sales,
              unconfirmed.purchases,
            ),
          },
        ]
      : []),
    ...(deadline
      ? [
          {
            icon: 'deadline' as const,
            action: 'jpk' as const,
            title: noticesCopy.jpkTitle(
              deadline.form,
              periodPhrase({ mode: 'month', year: deadline.year, month: deadline.month }),
            ),
            text: noticesCopy.jpkText(formatDate(deadline.date)),
          },
        ]
      : []),
    {
      icon: 'year',
      action: 'year',
      title: noticesCopy.yearTitle(
        accountingYear.year,
        accountingYear.status.toLocaleLowerCase('pl'),
      ),
      text: noticesCopy.yearText,
    },
  ];
}
