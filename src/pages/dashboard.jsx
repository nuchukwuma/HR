import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { Avatar, Badge, Button, Card, EmptyState, PageHeader } from '../components/ui';

// A small number + label box, like "Employees  12"
function StatTile({ label, value, loading }) {
  return (
    <div className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
      <p className="text-sm text-blue-900/60">{label}</p>
      <p className="mt-1 text-3xl font-bold text-blue-950">{loading ? '—' : value}</p>
    </div>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const isBoss = user.role === 'manager' || user.role === 'hr';

  const [photoUrl, setPhotoUrl] = useState(null);
  const [stats, setStats] = useState({ team: null, pending: null, todayShifts: null, goals: null });
  const [upcomingShifts, setUpcomingShifts] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // Run every lookup at once. Promise.allSettled means one failing call
    // (e.g. an employee isn't allowed to see /requests/inbox) doesn't break the rest.
    Promise.allSettled([
      api('/employees'),
      isBoss ? api('/requests/inbox') : api('/requests/mine'),
      api(`/shifts?from=${now.toISOString()}&to=${weekAhead.toISOString()}`),
      api('/goals'),
      api('/requests/activity'),
      api('/profiles/me'),
    ]).then(([employees, requests, shifts, goals, activities, profile]) => {
      if (profile.status === 'fulfilled') setPhotoUrl(profile.value.profile.profilePhoto);

      const pendingCount = requests.status === 'fulfilled'
        ? requests.value.requests.filter((r) => r.status === 'submitted' || r.status === 'in-review').length
        : null;
      const shiftList = shifts.status === 'fulfilled' ? shifts.value.shifts : [];
      const todayCount = shiftList.filter((s) => new Date(s.startTime) <= todayEnd).length;
      const openGoals = goals.status === 'fulfilled' ? goals.value.goals.filter((g) => g.status !== 'completed').length : null;

      setStats({
        team: employees.status === 'fulfilled' ? employees.value.items.length : null,
        pending: pendingCount,
        todayShifts: todayCount,
        goals: openGoals,
      });
      setUpcomingShifts(
        shiftList
          .slice()
          .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
          .slice(0, 3)
      );
      setActivity(activities.status === 'fulfilled' ? activities.value.activities.slice(0, 4) : []);
      setLoading(false);
    });
  }, [isBoss]);

  // Where the quick-action buttons go
  const quickActions = isBoss
    ? [
        { label: '+ Add employee', path: '/employee-data?create=1' },
        { label: '+ Add business partner', path: '/partners?create=1' },
        { label: '+ Post an update', path: '/posts' },
      ]
    : [
        { label: '+ Send a request', path: '/requests' },
        { label: 'View my shifts', path: '/shifts' },
        { label: 'Open chat', path: '/chat' },
      ];

  // Everything else worth a shortcut to
  const moreLinks = [
    { name: 'Chat', path: '/chat', text: 'Talk with your team or the whole company.' },
    { name: 'Posts', path: '/posts', text: 'Read announcements from HR and your manager.' },
    { name: 'Goals', path: '/goals', text: 'Set goals and track how far along you are.' },
    { name: 'Activity Log', path: '/activity-log', text: 'See what has happened to your requests.' },
    ...(isBoss
      ? [
          { name: 'Business Partners', path: '/partners', text: 'Companies we work with and their contracts.' },
        ]
      : []),
  ];

  // "ada@example.com" becomes "Ada"
  const firstName = user.email.split('@')[0];
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  return (
    <div>
      <PageHeader title={`Welcome, ${displayName}`} subtitle={user.email}>
        <Badge tone="blue">{user.role}</Badge>
        <Link to="/employee-data"><Avatar src={photoUrl} name={displayName} /></Link>
      </PageHeader>

      {/* Stat tiles */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label={isBoss ? 'People you manage' : 'People you can see'} value={stats.team} loading={loading} />
        <StatTile label="Pending requests" value={stats.pending} loading={loading} />
        <StatTile label="Shifts this week" value={stats.todayShifts} loading={loading} />
        <StatTile label="Open goals" value={stats.goals} loading={loading} />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        {/* Upcoming shifts */}
        <Card title="Upcoming shifts">
          {loading ? (
            <p className="text-sm text-blue-900/60">Loading...</p>
          ) : upcomingShifts.length === 0 ? (
            <EmptyState>No shifts in the next 7 days.</EmptyState>
          ) : (
            <ul className="divide-y divide-blue-100">
              {upcomingShifts.map((s) => (
                <li key={s._id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="text-blue-950">{s.userId._id === user._id ? 'My shift' : s.userId.email}</span>
                  <span className="text-blue-900/60">{new Date(s.startTime).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/shifts" className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline">
            View all shifts →
          </Link>
        </Card>

        {/* Quick actions + recent activity */}
        <div className="flex flex-col gap-4">
          <Card title="Quick actions">
            <div className="flex flex-col gap-2">
              {quickActions.map((a) => (
                <Link key={a.path} to={a.path}>
                  <Button className="w-full">{a.label}</Button>
                </Link>
              ))}
            </div>
          </Card>

          <Card title="Recent activity">
            {loading ? (
              <p className="text-sm text-blue-900/60">Loading...</p>
            ) : activity.length === 0 ? (
              <EmptyState>No activity yet.</EmptyState>
            ) : (
              <ul className="divide-y divide-blue-100">
                {activity.map((a) => (
                  <li key={a._id} className="py-2 text-sm">
                    <p className="text-blue-950">{a.description || a.action}</p>
                    <p className="text-xs text-blue-900/60">{new Date(a.createdAt).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* The rest of the app, as shortcuts */}
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-900/60">More</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {moreLinks.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow"
          >
            <h3 className="font-semibold text-blue-950">{item.name}</h3>
            <p className="mt-1 text-sm text-blue-900/60">{item.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
