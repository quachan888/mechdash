'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import AdminClient from './_components/admin-client';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const role = (session?.user as any)?.role;

  useEffect(() => {
    if (status === 'authenticated' && role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [status, role, router]);

  if (status === 'loading') {
    return <div className="p-6 flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  if (role !== 'admin') return null;

  return <AdminClient />;
}
