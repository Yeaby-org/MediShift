import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Small colored dot to tell R (blue) from PGY (green)
export function levelDotClass(level) {
  return level.startsWith('R') ? 'bg-apple-blue' : 'bg-apple-green';
}
