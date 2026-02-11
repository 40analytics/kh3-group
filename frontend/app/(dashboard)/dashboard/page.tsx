import EnhancedDashboard from '@/components/dashboard/EnhancedDashboard';

export const dynamic = 'force-dynamic'; // Disable caching for real-time data

export default async function DashboardPage() {
  return <EnhancedDashboard initialPeriod="month" />;
}
