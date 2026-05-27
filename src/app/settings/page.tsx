import { getCurrentUser } from '@/lib/auth';

export default async function SettingsPage() {
  const user = await getCurrentUser();

  return (
    <div className="space-y-6 pb-8">
      <h1 className="text-lg font-semibold text-white">Settings</h1>

      {user ? (
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 text-sm text-zinc-300">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Signed in</p>
          <p className="mt-2 text-white">{user.email}</p>
          <form action="/auth/logout" method="post" className="mt-4">
            <button type="submit" className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-white">Sign out</button>
          </form>
        </section>
      ) : null}

    </div>
  );
}
