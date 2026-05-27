import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { LoginPanel } from '@/components/login-panel';

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect('/collection');

  return <LoginPanel />;
}
