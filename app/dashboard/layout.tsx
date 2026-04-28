import { LayoutDashboard } from '@/components/dashboard/layout-dashboard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LayoutDashboard>{children}</LayoutDashboard>;
}
