import { getCurrentUser } from '@/lib/auth';
import { getUserThemeSettings } from '@/lib/preferences';
import { SettingsPanel } from '@/components/settings-panel';

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const theme = user ? getUserThemeSettings(user) : null;

  return (
    <div className="space-y-6 pb-8">
      <h1 className="text-lg font-semibold text-white">Settings</h1>

      {user && theme ? <SettingsPanel email={user.email ?? ''} initialTheme={theme} /> : null}

    </div>
  );
}
