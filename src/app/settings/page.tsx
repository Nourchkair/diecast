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

      <section className="space-y-4 rounded-[2rem] border border-white/10 bg-white/5 p-5">
        <div>
          <h2 className="text-lg font-semibold text-white">Data tools</h2>
          <p className="mt-1 text-sm text-zinc-400">Export your full collection as JSON, or import a compatible backup file.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href="/api/export" className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-zinc-950">Download export</a>
        </div>
        <form action="/api/import" method="post" encType="multipart/form-data" className="space-y-3">
          <label className="grid gap-2">
            <span className="text-sm text-zinc-300">Import JSON backup</span>
            <input type="file" name="file" accept="application/json" className="rounded-2xl border border-dashed border-white/15 bg-zinc-950 px-4 py-3 text-white" />
          </label>
          <button type="submit" className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-white">Import file</button>
        </form>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 text-sm text-zinc-300">
        <h2 className="text-lg font-semibold text-white">Scan notes</h2>
        <p className="mt-2 leading-6 text-zinc-400">
          Barcode scanning works best over HTTPS or localhost. For iPhone or browsers that do not support native barcode detection, use the photo/OCR flow or manual entry.
        </p>
      </section>
    </div>
  );
}
