import { LayoutDashboard, CalendarDays, Ticket, Sparkles, Video, MessagesSquare, Users, UserPlus, MessageCircle, Bell, UserCircle, PlusCircle, ListChecks, Mic2, BarChart3, ClipboardCheck, ShieldCheck, Building2 } from 'lucide-react';

export const homeFor = (role) => (role ? `/${role}/dashboard` : '/login');

export const NAV = {
  participant: [
    { to: '/participant/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/participant/events', label: 'Explore Events', icon: CalendarDays },
    { to: '/participant/my-events', label: 'My Events', icon: Ticket },
    { to: '/participant/matchmaker', label: 'Matchmaker', icon: Sparkles },
    { to: '/participant/networking', label: 'Speed Networking', icon: Video },
    { to: '/participant/live-qa', label: 'Live Q&A', icon: MessagesSquare },
    { to: '/participant/connections', label: 'Connections', icon: Users },
    { to: '/participant/connection-requests', label: 'Requests', icon: UserPlus },
    { to: '/participant/chat', label: 'Chat', icon: MessageCircle },
    { to: '/participant/notifications', label: 'Notifications', icon: Bell },
    { to: '/participant/profile', label: 'Profile', icon: UserCircle },
  ],
  organizer: [
    { to: '/organizer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/organizer/events', label: 'My Events', icon: CalendarDays },
    { to: '/organizer/events/create', label: 'Create Event', icon: PlusCircle },
    { to: '/organizer/sessions', label: 'Sessions', icon: ListChecks },
    { to: '/organizer/speakers', label: 'Speakers', icon: Mic2 },
    { to: '/organizer/attendance', label: 'Registrations', icon: ClipboardCheck },
    { to: '/organizer/live-qa', label: 'Live Q&A', icon: MessagesSquare },
    { to: '/organizer/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/organizer/notifications', label: 'Notifications', icon: Bell },
    { to: '/organizer/profile', label: 'Profile', icon: UserCircle },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/organizers', label: 'Organizers', icon: Building2 },
    { to: '/admin/events', label: 'Events', icon: ShieldCheck },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/admin/notifications', label: 'Notifications', icon: Bell },
    { to: '/admin/profile', label: 'Profile', icon: UserCircle },
  ],
};
