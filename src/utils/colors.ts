import { normalizeSearchKey } from './normalizer';

// Paleta universitaria marina: tonos océano, turquesa, aqua, índigo, zafiro, menta y coral suave
const COLOR_PALETTES = [
  {
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
    text: 'text-cyan-950',
    badge: 'bg-cyan-600 text-white',
    accent: 'bg-cyan-500',
    lightBorder: 'border-cyan-300',
    solidBg: 'bg-cyan-600',
    glow: 'rgba(6, 182, 212, 0.2)'
  },
  {
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    text: 'text-sky-950',
    badge: 'bg-sky-600 text-white',
    accent: 'bg-sky-500',
    lightBorder: 'border-sky-300',
    solidBg: 'bg-sky-600',
    glow: 'rgba(14, 165, 233, 0.2)'
  },
  {
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    text: 'text-teal-950',
    badge: 'bg-teal-700 text-white',
    accent: 'bg-teal-500',
    lightBorder: 'border-teal-300',
    solidBg: 'bg-teal-700',
    glow: 'rgba(20, 184, 166, 0.2)'
  },
  {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-950',
    badge: 'bg-blue-700 text-white',
    accent: 'bg-blue-600',
    lightBorder: 'border-blue-300',
    solidBg: 'bg-blue-700',
    glow: 'rgba(37, 99, 235, 0.2)'
  },
  {
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    text: 'text-indigo-950',
    badge: 'bg-indigo-700 text-white',
    accent: 'bg-indigo-500',
    lightBorder: 'border-indigo-300',
    solidBg: 'bg-indigo-700',
    glow: 'rgba(99, 102, 241, 0.2)'
  },
  {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-950',
    badge: 'bg-emerald-700 text-white',
    accent: 'bg-emerald-500',
    lightBorder: 'border-emerald-300',
    solidBg: 'bg-emerald-700',
    glow: 'rgba(16, 185, 129, 0.2)'
  },
  {
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    text: 'text-violet-950',
    badge: 'bg-violet-700 text-white',
    accent: 'bg-violet-500',
    lightBorder: 'border-violet-300',
    solidBg: 'bg-violet-700',
    glow: 'rgba(139, 92, 246, 0.2)'
  },
  {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-950',
    badge: 'bg-amber-700 text-white',
    accent: 'bg-amber-500',
    lightBorder: 'border-amber-300',
    solidBg: 'bg-amber-700',
    glow: 'rgba(245, 158, 11, 0.2)'
  }
];

export interface ColorScheme {
  bg: string;
  border: string;
  text: string;
  badge: string;
  accent: string;
  lightBorder: string;
  solidBg: string;
  glow: string;
}

const colorCache = new Map<string, ColorScheme>();

export function getSubjectColorScheme(subjectName: string | undefined | null): ColorScheme {
  if (!subjectName) return COLOR_PALETTES[0];
  const key = normalizeSearchKey(subjectName);
  
  if (colorCache.has(key)) {
    return colorCache.get(key)!;
  }

  // Consistent hash based on subject string
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % COLOR_PALETTES.length;
  const scheme = COLOR_PALETTES[index];
  colorCache.set(key, scheme);
  return scheme;
}
