'use client';

import { useState } from 'react';
import { LoginForm } from '@/components/login-form';

export function LoginPanel() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  return (
    <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md items-center justify-center py-8">
      <div className="w-full space-y-8 px-2 sm:px-0">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/80">Diecast Collection</p>
          <h1 className="text-3xl font-semibold text-white">{mode === 'signup' ? 'Create account' : 'Log in'}</h1>
          <p className="text-sm leading-6 text-zinc-400">
            {mode === 'signup'
              ? 'Create an account with your email and password.'
              : 'Use your email and password. Your session stays active when you come back.'}
          </p>
        </div>
        <LoginForm onModeChange={setMode} />
      </div>
    </div>
  );
}
