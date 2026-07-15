
import { DashboardStats } from '@/components/admin/dashboard-stats';
import { RevenueChart } from '@/components/admin/revenue-chart';
import { EnrollmentsChart } from '@/components/admin/enrollments-chart';
import { UpcomingCohorts } from '@/components/admin/upcoming-cohorts';
import NotificationsPanel from '@/components/admin/notifications-panel';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Vista general de tu escuela de yoga
        </p>
      </div>

      {/* KPIs */}
      <DashboardStats />

      {/* Notifications */}
      <NotificationsPanel />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart />
        <EnrollmentsChart />
      </div>

      {/* Upcoming Cohorts */}
      <UpcomingCohorts />
    </div>
  );
}
