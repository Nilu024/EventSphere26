import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import AuthLayout from '@/components/layout/AuthLayout';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/protected/ProtectedRoute';
import RoleProtectedRoute from '@/components/protected/RoleProtectedRoute';
import { Loader } from '@/components/common/States';

const L = (fn) => lazy(fn);
const Landing = L(() => import('@/pages/public/Landing'));
const About = L(() => import('@/pages/public/About'));
const Contact = L(() => import('@/pages/public/Contact'));
const NotFound = L(() => import('@/pages/public/NotFound'));
const Login = L(() => import('@/pages/auth/Login'));
const Register = L(() => import('@/pages/auth/Register'));
const ForgotPassword = L(() => import('@/pages/auth/ForgotPassword'));
const ResetPassword = L(() => import('@/pages/auth/ResetPassword'));

const Profile = L(() => import('@/pages/shared/Profile'));
const Notifications = L(() => import('@/pages/shared/Notifications'));
const EventDetail = L(() => import('@/pages/shared/EventDetail'));

const PDash = L(() => import('@/pages/participant/Dashboard'));
const PEvents = L(() => import('@/pages/participant/Events'));
const PMyEvents = L(() => import('@/pages/participant/MyEvents'));
const Matchmaker = L(() => import('@/features/matchmaker/pages/Matchmaker'));
const Connections = L(() => import('@/features/connectionHub/pages/Connections'));
const ConnectionRequests = L(() => import('@/features/connectionHub/pages/ConnectionRequests'));
const Chat = L(() => import('@/features/connectionHub/pages/Chat'));
const Networking = L(() => import('@/features/speedNetworking/pages/Networking'));
const PLiveQA = L(() => import('@/features/liveQA/pages/LiveQAPage'));

const ODash = L(() => import('@/pages/organizer/Dashboard'));
const OEvents = L(() => import('@/pages/organizer/Events'));
const OEventForm = L(() => import('@/pages/organizer/EventForm'));
const OEventManage = L(() => import('@/pages/organizer/EventManage'));
const OSessions = L(() => import('@/pages/organizer/Sessions'));
const OSpeakers = L(() => import('@/pages/organizer/Speakers'));
const OAttendance = L(() => import('@/pages/organizer/Attendance'));
const Analytics = L(() => import('@/features/analytics/pages/AnalyticsDashboard'));

const ADash = L(() => import('@/pages/admin/Dashboard'));
const AUsers = L(() => import('@/pages/admin/Users'));
const AEvents = L(() => import('@/pages/admin/Events'));

export default function AppRoutes() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Route>

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route element={<RoleProtectedRoute allow={['participant']} />}>
              <Route path="/participant" element={<Navigate to="dashboard" replace />} />
              <Route path="/participant/dashboard" element={<PDash />} />
              <Route path="/participant/events" element={<PEvents />} />
              <Route path="/participant/events/:eventId" element={<EventDetail />} />
              <Route path="/participant/my-events" element={<PMyEvents />} />
              <Route path="/participant/profile" element={<Profile />} />
              <Route path="/participant/matchmaker" element={<Matchmaker />} />
              <Route path="/participant/connections" element={<Connections />} />
              <Route path="/participant/connection-requests" element={<ConnectionRequests />} />
              <Route path="/participant/chat" element={<Chat />} />
              <Route path="/participant/chat/:userId" element={<Chat />} />
              <Route path="/participant/networking" element={<Networking />} />
              <Route path="/participant/live-qa" element={<PLiveQA />} />
              <Route path="/participant/notifications" element={<Notifications />} />
            </Route>

            <Route element={<RoleProtectedRoute allow={['organizer']} />}>
              <Route path="/organizer" element={<Navigate to="dashboard" replace />} />
              <Route path="/organizer/dashboard" element={<ODash />} />
              <Route path="/organizer/events" element={<OEvents />} />
              <Route path="/organizer/events/create" element={<OEventForm />} />
              <Route path="/organizer/events/:eventId" element={<OEventManage />} />
              <Route path="/organizer/events/:eventId/edit" element={<OEventForm />} />
              <Route path="/organizer/events/:eventId/view" element={<EventDetail />} />
              <Route path="/organizer/sessions" element={<OSessions />} />
              <Route path="/organizer/speakers" element={<OSpeakers />} />
              <Route path="/organizer/attendance" element={<OAttendance />} />
              <Route path="/organizer/analytics" element={<Analytics />} />
              <Route path="/organizer/live-qa" element={<PLiveQA />} />
              <Route path="/organizer/profile" element={<Profile />} />
              <Route path="/organizer/notifications" element={<Notifications />} />
            </Route>

            <Route element={<RoleProtectedRoute allow={['admin']} />}>
              <Route path="/admin" element={<Navigate to="dashboard" replace />} />
              <Route path="/admin/dashboard" element={<ADash />} />
              <Route path="/admin/users" element={<AUsers />} />
              <Route path="/admin/organizers" element={<AUsers roleFilter="organizer" />} />
              <Route path="/admin/events" element={<AEvents />} />
              <Route path="/admin/events/:eventId" element={<EventDetail />} />
              <Route path="/admin/analytics" element={<Analytics />} />
              <Route path="/admin/profile" element={<Profile />} />
              <Route path="/admin/notifications" element={<Notifications />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
