'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard } from '@/components/dashboard/layout-dashboard';
import { getUserData } from '@/lib/auth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const user = getUserData();
    if (!user || user.role !== 'SUPERADMIN') {
      router.replace('/dashboard/rifas');
    }
  }, [router]);

  return <LayoutDashboard>{children}</LayoutDashboard>;
}
