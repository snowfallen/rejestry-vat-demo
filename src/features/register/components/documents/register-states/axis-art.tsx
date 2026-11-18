import { cssVars } from '@/lib/css-vars';
import { cx } from '@/lib/cx';
import a from './register-states.module.css';

// Seven months on the axis: output VAT above, input VAT below, as on the period strip.
const rises = [14, 22, 10, 26, 18, 12, 20];
const falls = [8, 12, 6, 14, 10, 7, 11];
const axisY = 36;
const barX = (i: number) => 14 + i * 16;

interface AxisArtProps {
  variant: 'populated' | 'empty' | 'search' | 'error';
  /** 72×40, for the demo-state cards. */
  small?: boolean;
}

/** The state's picture: the period strip's VAT axis, full, emptied, searched or broken. */
export function AxisArt({ variant, small = false }: AxisArtProps) {
  return (
    <svg
      className={cx(a.art, small && a.small)}
      viewBox="0 0 132 72"
      aria-hidden="true"
      focusable="false"
    >
      {rises.map((rise, i) => {
        const fall = falls[i];
        const style = cssVars({ '--i': i });
        if (variant === 'populated')
          return (
            <g key={i}>
              <rect
                className={a.solid}
                x={barX(i)}
                y={axisY - rise}
                width="8"
                height={rise}
                rx="2"
              />
              <rect
                className={a.solidDown}
                x={barX(i)}
                y={axisY + 3}
                width="8"
                height={fall}
                rx="2"
              />
            </g>
          );
        if (variant === 'empty')
          return (
            <g key={i}>
              <rect
                className={a.ghost}
                x={barX(i)}
                y={axisY - rise}
                width="8"
                height={rise}
                rx="2"
              />
              <rect className={a.ghost} x={barX(i)} y={axisY + 3} width="8" height={fall} rx="2" />
            </g>
          );
        // Beside the break the bars slump toward it.
        const slump = variant === 'error' && (i === 3 || i === 4);
        return (
          <g
            key={i}
            className={cx(slump && a.slump)}
            style={slump ? cssVars({ '--tilt': i === 3 ? '-9deg' : '8deg' }) : undefined}
          >
            <rect
              className={cx(a.bar, a.up, a.faded)}
              style={style}
              x={barX(i)}
              y={axisY - rise}
              width="8"
              height={rise}
              rx="2"
            />
            <rect
              className={cx(a.bar, a.down, a.fadedDown)}
              style={style}
              x={barX(i)}
              y={axisY + 3}
              width="8"
              height={fall}
              rx="2"
            />
          </g>
        );
      })}
      {variant === 'error' ? (
        <>
          <line className={a.axis} x1="4" y1={axisY + 1.5} x2="60" y2={axisY + 1.5} />
          <line className={a.axis} x1="76" y1={axisY + 1.5} x2="128" y2={axisY + 1.5} />
          <path className={a.break} d={`M60 ${axisY + 1.5} l4 -5 l4 10 l4 -10 l4 5`} />
        </>
      ) : (
        <line className={a.axis} x1="4" y1={axisY + 1.5} x2="128" y2={axisY + 1.5} />
      )}
      {variant === 'empty' && (
        <>
          <circle className={a.pulse} cx="66" cy={axisY + 1.5} r="5" />
          <circle className={a.point} cx="66" cy={axisY + 1.5} r="3" />
        </>
      )}
      {variant === 'search' && (
        <g className={a.lens}>
          <circle cx="66" cy="30" r="13" />
          <path d="M75.5 39.5l9 9" />
        </g>
      )}
    </svg>
  );
}
