'use client';
import { useRef, type KeyboardEvent } from 'react';
import { cssVars } from '@/lib/css-vars';
import { cx } from '@/lib/cx';
import s from './segmented-control.module.css';

interface SegmentedControlProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/**
 * Radio group drawn as a segmented switch. The selected thumb slides between
 * options; arrow keys move the selection (roving tab index).
 */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const index = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  function onKeyDown(event: KeyboardEvent) {
    const step = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[event.key];
    let next = index;
    if (step) next = (index + step + options.length) % options.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = options.length - 1;
    else return;
    event.preventDefault();
    onChange(options[next].value);
    buttons.current[next]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cx(s.control, className)}
      style={cssVars({ '--count': options.length, '--index': index })}
      onKeyDown={onKeyDown}
    >
      <span className={s.thumb} aria-hidden="true" />
      {options.map((option, i) => (
        <button
          key={option.value}
          ref={(element) => {
            buttons.current[i] = element;
          }}
          type="button"
          role="radio"
          aria-checked={i === index}
          tabIndex={i === index ? 0 : -1}
          className={s.option}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
