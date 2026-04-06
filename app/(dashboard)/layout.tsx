import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import Header from '@/components/Header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header user={user} />
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}
