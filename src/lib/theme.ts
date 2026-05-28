export type ThemeSettings = {
  accentColor: string;
  backgroundColor: string;
  backgroundImageUrl: string | null;
};

export const defaultThemeSettings: ThemeSettings = {
  accentColor: '#10b981',
  backgroundColor: '#09090b',
  backgroundImageUrl: null,
};

function clampByte(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function normalizeHex(value: string, fallback: string) {
  const input = value.trim();
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(input)) return fallback;
  if (input.length === 4) {
    return `#${input.slice(1).split('').map((char) => char + char).join('')}`.toLowerCase();
  }
  return input.toLowerCase();
}

export function normalizeThemeSettings(input: Partial<ThemeSettings> | null | undefined): ThemeSettings {
  return {
    accentColor: normalizeHex(input?.accentColor ?? defaultThemeSettings.accentColor, defaultThemeSettings.accentColor),
    backgroundColor: normalizeHex(input?.backgroundColor ?? defaultThemeSettings.backgroundColor, defaultThemeSettings.backgroundColor),
    backgroundImageUrl: typeof input?.backgroundImageUrl === 'string' && input.backgroundImageUrl.trim() ? input.backgroundImageUrl.trim() : null,
  };
}

function hexToRgb(hex: string) {
  const normalized = normalizeHex(hex, defaultThemeSettings.accentColor).slice(1);
  const value = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized;
  const number = Number.parseInt(value, 16);
  return {
    r: (number >> 16) & 255,
    g: (number >> 8) & 255,
    b: number & 255,
  };
}

function mixHex(base: string, target: string, amount: number) {
  const source = hexToRgb(base);
  const mix = hexToRgb(target);
  const ratio = Math.max(0, Math.min(1, amount));
  return `rgb(${clampByte(source.r + (mix.r - source.r) * ratio)} ${clampByte(source.g + (mix.g - source.g) * ratio)} ${clampByte(source.b + (mix.b - source.b) * ratio)})`;
}

function getLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function getAccessibleAccentForeground(accentColor: string) {
  const { r, g, b } = hexToRgb(accentColor);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? '#09090b' : '#ffffff';
}

export function buildThemeVariables(settings: ThemeSettings) {
  const theme = normalizeThemeSettings(settings);
  const accent = theme.accentColor;
  const foreground = getAccessibleAccentForeground(accent);

  return {
    '--app-accent': accent,
    '--app-accent-foreground': foreground,
    '--app-background': theme.backgroundColor,
    '--color-emerald-50': mixHex(accent, '#ffffff', 0.86),
    '--color-emerald-100': mixHex(accent, '#ffffff', 0.72),
    '--color-emerald-200': mixHex(accent, '#ffffff', 0.54),
    '--color-emerald-300': mixHex(accent, '#ffffff', 0.34),
    '--color-emerald-400': accent,
    '--color-emerald-500': mixHex(accent, '#000000', 0.12),
    '--color-emerald-600': mixHex(accent, '#000000', 0.24),
    '--color-emerald-700': mixHex(accent, '#000000', 0.36),
    '--color-emerald-800': mixHex(accent, '#000000', 0.48),
    '--color-emerald-900': mixHex(accent, '#000000', 0.6),
  } as const;
}

export function buildBodyBackground(settings: ThemeSettings) {
  const theme = normalizeThemeSettings(settings);
  const accentOverlay = `radial-gradient(circle at top, color-mix(in srgb, ${theme.accentColor} 18%, transparent), transparent 34%)`;
  const contrastOverlay = getLuminance(theme.backgroundColor) > 0.65
    ? 'linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.28))'
    : 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(0,0,0,0.12))';
  const imageLayer = theme.backgroundImageUrl ? `url("${theme.backgroundImageUrl}")` : null;
  return {
    backgroundColor: theme.backgroundColor,
    backgroundImage: imageLayer ? `${contrastOverlay}, ${accentOverlay}, ${imageLayer}` : `${contrastOverlay}, ${accentOverlay}`,
    backgroundSize: imageLayer ? 'cover, cover, cover' : 'cover, cover',
    backgroundPosition: imageLayer ? 'center, center, center' : 'center, center',
    backgroundAttachment: imageLayer ? 'fixed, fixed, fixed' : 'fixed, fixed',
    backgroundRepeat: 'no-repeat',
  } as const;
}
