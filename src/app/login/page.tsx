import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/login-form';
import { getCurrentUser } from '@/lib/auth';

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect('/collection');

  return (
    <div className="flex min-h-[calc(100vh-2rem)] items-center justify-center py-8">
      <div className="w-full max-w-md space-y-6 rounded-[2.5rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/80">Diecast Collection</p>
          <h1 className="text-3xl font-semibold text-white">Sign in with a magic link</h1>
          <p className="text-sm leading-6 text-zinc-400">Use your email to get a secure link. Your session stays active when you come back.</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
