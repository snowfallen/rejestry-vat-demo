'use client';
import { Moon, Sun } from 'lucide-react';
import { IconButton } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';
import { headerCopy } from '../../copy';

/** Light and dark theme; the new theme spreads from the button. Phones switch it in the account dialog. */
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';
  return (
    <IconButton
      label={headerCopy.theme(dark)}
      variant="plain"
      className="phone:hidden"
      onClick={(event) => {
        const box = event.currentTarget.getBoundingClientRect();
        toggle({ x: box.left + box.width / 2, y: box.top + box.height / 2 });
      }}
    >
      {dark ? <Sun size={19} /> : <Moon size={19} />}
    </IconButton>
  );
}
