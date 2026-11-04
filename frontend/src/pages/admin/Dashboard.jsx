import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { PlatformAnalytics } from '@/features/analytics/pages/AnalyticsDashboard';
import { useAuth } from '@/hooks/useAuth';

export default function AdminDashboard() {
  const { user } = useAuth();
  return (
    <>
      <PageHeader title="Admin dashboard" description={`Platform overview for ${user?.name || 'admin'}.`}
        actions={<><Link to="/admin/users"><Button variant="outline">Manage users</Button></Link><Link to="/admin/events"><Button variant="outline">Moderate events</Button></Link></>} />
      <PlatformAnalytics />
    </>
  );
}
