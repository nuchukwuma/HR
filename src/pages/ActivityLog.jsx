import { useCallback, useEffect, useState } from 'react';
//import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { Alert, Button, Card, EmptyState, PageHeader } from '../components/ui';
import { tableClass, tdClass, thClass } from '../utils/styles';

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

function ActivityLog() {
  //const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [error, setError] = useState('');

  const loadActivities = useCallback(async () => {
    try {
      const data = await api('/requests/activity');
      setActivities(data.activities || []);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadActivities();
  }, [loadActivities]);



  return (
    <div>
      <PageHeader title="Activity Log" >
        <Button variant="secondary" onClick={loadActivities}>Refresh activity</Button>
      </PageHeader>
      {error && <Alert>Error: {error}</Alert>}

      <Card>
        {activities.length === 0 ? <EmptyState>No activity has been recorded yet.</EmptyState> : (
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>Date and time</th><th className={thClass}>Action by</th>
                  <th className={thClass}>Employee</th><th className={thClass}>Action</th>
                  <th className={thClass}>Request type</th><th className={thClass}>Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {activities.map((activity) => (
                  <tr key={activity._id}>
                    <td className={`${tdClass} whitespace-nowrap`}>{formatDate(activity.createdAt)}</td>
                    <td className={tdClass}>{activity.userId?.email || 'Unknown user'}</td>
                    <td className={tdClass}>{activity.subjectUserId?.email || '—'}</td>
                    <td className={tdClass}>{activity.action}</td>
                    <td className={tdClass}>{activity.topic || '—'}</td>
                    <td className={tdClass}>{activity.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export default ActivityLog;
