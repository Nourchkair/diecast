import { getCurrentUser } from '@/lib/auth';
import { getUserThemeSettings } from '@/lib/preferences';
import { SettingsPanel } from '@/components/settings-panel';
import { getProfileByUserId } from '@/lib/social';

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const theme = user ? getUserThemeSettings(user) : null;
  const profile = user ? await getProfileByUserId(user.id) : null;

  return (
    <div className="space-y-6 pb-8">
      <h1 className="text-lg font-semibold text-white">Settings</h1>

      {user && theme && profile ? <SettingsPanel email={user.email ?? ''} initialTheme={theme} initialProfile={profile} /> : null}

    </div>
  );
}
