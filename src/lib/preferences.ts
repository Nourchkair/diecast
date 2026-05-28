import type { SupabaseClient, User } from '@supabase/supabase-js';
import { defaultThemeSettings, normalizeThemeSettings, type ThemeSettings } from '@/lib/theme';

type ThemeMetadata = {
  theme_settings?: Partial<ThemeSettings> | string | null;
};

function readThemeMetadata(user: User | null | undefined): ThemeSettings {
  const metadata = (user?.user_metadata ?? {}) as ThemeMetadata;
  const raw = metadata.theme_settings;
  if (typeof raw === 'string') {
    try {
      return normalizeThemeSettings(JSON.parse(raw) as Partial<ThemeSettings>);
    } catch {
      return defaultThemeSettings;
    }
  }
  return normalizeThemeSettings(raw ?? defaultThemeSettings);
}

export function getUserThemeSettings(user: User | null | undefined): ThemeSettings {
  return readThemeMetadata(user);
}

export async function upsertUserThemeSettings(supabase: SupabaseClient, settings: Partial<ThemeSettings>) {
  const current = await supabase.auth.getUser();
  const nextTheme = normalizeThemeSettings({
    ...readThemeMetadata(current.data.user),
    ...settings,
  });

  const { data, error } = await supabase.auth.updateUser({
    data: {
      theme_settings: nextTheme,
    },
  });

  if (error) throw error;
  return { user: data.user, theme: nextTheme };
}
