'use client';
import { LayoutGrid } from 'lucide-react';
import { cx } from '@/lib/cx';
import { areaTabIcons } from '../../model/area-icons';
import { areaTabs, type AreaTab } from '../../model/areas';
import t from './area-tab-bar.module.css';
import { areasCopy, headerCopy } from '../../copy';

const shortLabels: Record<AreaTab, string> = areasCopy.short;

/**
 * On phones the accounting areas live where an app keeps its sections: in a tab bar
 * at the bottom, in reach of the thumb. The last item opens the whole map.
 */
interface AreaTabBarProps {
  current: AreaTab;
  onSelect: (tab: AreaTab) => void;
  onOpenMap: () => void;
}

export function AreaTabBar({ current: open, onSelect, onOpenMap }: AreaTabBarProps) {
  return (
    <nav aria-label={headerCopy.areas} className={t.bar} data-bottom-bar="">
      <ul className={t.items}>
        {areaTabs.map(({ id, label }) => {
          const Icon = areaTabIcons[id];
          const current = id === open;
          return (
            <li key={id}>
              <button
                type="button"
                aria-current={current ? 'page' : undefined}
                aria-label={label}
                className={cx(t.item, current && t.current)}
                onClick={() => !current && onSelect(id)}
              >
                <span className={t.icon}>
                  <Icon size={21} />
                </span>
                <span aria-hidden="true">{shortLabels[id]}</span>
              </button>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            aria-haspopup="dialog"
            className={t.item}
            onClick={() => onOpenMap()}
          >
            <span className={t.icon}>
              <LayoutGrid size={21} />
            </span>
            Obszary
          </button>
        </li>
      </ul>
    </nav>
  );
}
