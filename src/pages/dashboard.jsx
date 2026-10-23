import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { Avatar, Button, Card, EmptyState, PageHeader } from '../components/ui';

function Dashboard() {
  const { user } = useAuth();
  const isBoss = user.role === 'manager' || user.role === 'hr';

  const [photoUrl, setPhotoUrl] = useState(null);
  const [upcomingShifts, setUpcomingShifts] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    Promise.allSettled([
      api(`/shifts?from=${now.toISOString()}&to=${weekAhead.toISOString()}`),
      api('/requests/activity'),
      api('/profiles/me'),
    ]).then(([shifts, activities, profile]) => {
      if (profile.status === 'fulfilled') setPhotoUrl(profile.value.profile?.profilePhoto || null);

      const shiftList = shifts.status === 'fulfilled' ? shifts.value.shifts : [];
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

  const quickActions = isBoss
    ? [
        { label: '+ Add employee', path: '/employee-data?create=1' },
        { label: '+ Add business partner', path: '/partners/new' },
        { label: '+ Post an update', path: '/posts' },
      ]
    : [
        { label: '+ Send a request', path: '/requests' },
        { label: 'View my shifts', path: '/shifts' },
        { label: 'Open chat', path: '/chat' },
      ];

  const moreLinks = [
    { name: 'Chat', path: '/chat' },
    { name: 'Posts', path: '/posts'},
    { name: 'Goals', path: '/goals' },
    { name: 'Activity Log', path: '/activity-log' },
    ...(isBoss
      ? [
          { name: 'Business Partners', path: '/partners' },
        ]
      : []),
  ];

  const firstName = user.email.split('@')[0];
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  return (
    <div>
      <PageHeader title={`Welcome, ${displayName}`} subtitle={user.email}>
        {/* <Badge tone="blue">{user.role}</Badge> */}
        <Link to="/employee-data"><Avatar src={photoUrl} name={displayName} /></Link>
      </PageHeader>

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
