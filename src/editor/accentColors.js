export const ACCENT_COLORS = [
  {
    id: 'indigo',
    label: 'Indigo',
    swatch: '#4f46e5',
    light: {
      '--accent': '#4f46e5',
      '--accent-soft': '#e0e7ff',
      '--accent-border': '#c7d2fe',
      '--accent-ring': 'rgba(79, 70, 229, 0.2)',
    },
    dark: {
      '--accent': '#a5b4fc',
      '--accent-soft': 'rgba(165, 180, 252, 0.14)',
      '--accent-border': 'rgba(165, 180, 252, 0.32)',
      '--accent-ring': 'rgba(165, 180, 252, 0.28)',
    },
  },
  {
    id: 'blue',
    label: 'Ocean',
    swatch: '#2563eb',
    light: {
      '--accent': '#2563eb',
      '--accent-soft': '#dbeafe',
      '--accent-border': '#bfdbfe',
      '--accent-ring': 'rgba(37, 99, 235, 0.2)',
    },
    dark: {
      '--accent': '#93c5fd',
      '--accent-soft': 'rgba(147, 197, 253, 0.14)',
      '--accent-border': 'rgba(147, 197, 253, 0.32)',
      '--accent-ring': 'rgba(147, 197, 253, 0.28)',
    },
  },
  {
    id: 'emerald',
    label: 'Emerald',
    swatch: '#059669',
    light: {
      '--accent': '#059669',
      '--accent-soft': '#d1fae5',
      '--accent-border': '#a7f3d0',
      '--accent-ring': 'rgba(5, 150, 105, 0.2)',
    },
    dark: {
      '--accent': '#6ee7b7',
      '--accent-soft': 'rgba(110, 231, 183, 0.14)',
      '--accent-border': 'rgba(110, 231, 183, 0.32)',
      '--accent-ring': 'rgba(110, 231, 183, 0.28)',
    },
  },
  {
    id: 'rose',
    label: 'Rose',
    swatch: '#e11d48',
    light: {
      '--accent': '#e11d48',
      '--accent-soft': '#ffe4e6',
      '--accent-border': '#fecdd3',
      '--accent-ring': 'rgba(225, 29, 72, 0.2)',
    },
    dark: {
      '--accent': '#fda4af',
      '--accent-soft': 'rgba(253, 164, 175, 0.14)',
      '--accent-border': 'rgba(253, 164, 175, 0.32)',
      '--accent-ring': 'rgba(253, 164, 175, 0.28)',
    },
  },
  {
    id: 'amber',
    label: 'Amber',
    swatch: '#d97706',
    light: {
      '--accent': '#d97706',
      '--accent-soft': '#fef3c7',
      '--accent-border': '#fde68a',
      '--accent-ring': 'rgba(217, 119, 6, 0.2)',
    },
    dark: {
      '--accent': '#fcd34d',
      '--accent-soft': 'rgba(252, 211, 77, 0.14)',
      '--accent-border': 'rgba(252, 211, 77, 0.32)',
      '--accent-ring': 'rgba(252, 211, 77, 0.28)',
    },
  },
  {
    id: 'violet',
    label: 'Violet',
    swatch: '#7c3aed',
    light: {
      '--accent': '#7c3aed',
      '--accent-soft': '#ede9fe',
      '--accent-border': '#ddd6fe',
      '--accent-ring': 'rgba(124, 58, 237, 0.2)',
    },
    dark: {
      '--accent': '#c4b5fd',
      '--accent-soft': 'rgba(196, 181, 253, 0.14)',
      '--accent-border': 'rgba(196, 181, 253, 0.32)',
      '--accent-ring': 'rgba(196, 181, 253, 0.28)',
    },
  },
  {
    id: 'cyan',
    label: 'Cyan',
    swatch: '#0891b2',
    light: {
      '--accent': '#0891b2',
      '--accent-soft': '#cffafe',
      '--accent-border': '#a5f3fc',
      '--accent-ring': 'rgba(8, 145, 178, 0.2)',
    },
    dark: {
      '--accent': '#67e8f9',
      '--accent-soft': 'rgba(103, 232, 249, 0.14)',
      '--accent-border': 'rgba(103, 232, 249, 0.32)',
      '--accent-ring': 'rgba(103, 232, 249, 0.28)',
    },
  },
  {
    id: 'slate',
    label: 'Graphite',
    swatch: '#475569',
    light: {
      '--accent': '#475569',
      '--accent-soft': '#e2e8f0',
      '--accent-border': '#cbd5e1',
      '--accent-ring': 'rgba(71, 85, 105, 0.2)',
    },
    dark: {
      '--accent': '#cbd5e1',
      '--accent-soft': 'rgba(203, 213, 225, 0.14)',
      '--accent-border': 'rgba(203, 213, 225, 0.32)',
      '--accent-ring': 'rgba(203, 213, 225, 0.28)',
    },
  },
];

export const DEFAULT_ACCENT_ID = 'indigo';

export function getAccent(id) {
  return ACCENT_COLORS.find((c) => c.id === id) || ACCENT_COLORS[0];
}


/* Darken a hex color by a 0–1 factor (0 = original, 1 = black). */
export function darkenHex(hex, amount) {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  const r = Math.max(0, Math.round(((num >> 16) & 0xff) * (1 - amount)));
  const g = Math.max(0, Math.round(((num >> 8) & 0xff) * (1 - amount)));
  const b = Math.max(0, Math.round((num & 0xff) * (1 - amount)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/* Hex → rgba string with the given alpha. */
export function hexToRgba(hex, alpha) {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}