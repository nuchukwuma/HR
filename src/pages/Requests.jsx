import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { Alert, Badge, Button, Card, EmptyState, PageHeader } from '../components/ui';
import { inputClass, labelClass, tableClass, tdClass, thClass } from '../utils/styles';

const requestTypes = [
  { value: 'leave', label: 'Leave' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'document', label: 'Document' },
  { value: 'complaint', label: 'Complaint' },
  { value: 'incident', label: 'Incident' },
  { value: 'other', label: 'Other' },
];

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
}

function formatStatus(status) {
  return (status || 'submitted').replace('-', ' ');
}

// Each status gets its own badge colour
const statusTones = {
  submitted: 'gray',
  'in-review': 'blue',
  approved: 'green',
  rejected: 'red',
  resolved: 'green',
};

function StatusBadge({ status }) {
  return <Badge tone={statusTones[status] || 'gray'}>{formatStatus(status)}</Badge>;
}

function Requests() {
  const { user } = useAuth();
  const canReview = user.role === 'manager' || user.role === 'hr';

  const [form, setForm] = useState({
    type: 'leave',
    topic: '',
    date: '',
    essay: '',
    aboutManager: false,
  });
  const [myRequests, setMyRequests] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [mineData, notificationData] = await Promise.all([
        api('/requests/mine'),
        api('/notifications'),
      ]);
      setMyRequests(mineData.requests || []);
      setNotifications(notificationData.notifications || []);

      if (canReview) {
        const inboxData = await api('/requests/inbox');
        setInbox(inboxData.requests || []);
      } else {
        setInbox([]);
      }
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [canReview]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const changeField = (event) => {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const submitRequest = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const result = await api('/requests', { method: 'POST', body: form });
      setMessage(result.message || 'Request sent successfully.');
      setForm({ type: 'leave', topic: '', date: '', essay: '', aboutManager: false });
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (request, newStatus) => {
    let note = '';
    if (newStatus === 'rejected') {
      const reason = window.prompt('Please enter the reason for rejecting this request:');
      if (reason === null) return;
      note = reason.trim();
      if (!note) {
        setError('A reason is required when rejecting a request.');
        return;
      }
    }

    setError('');
    setMessage('');
    try {
      const result = await api(`/requests/${request._id}/status`, {
        method: 'PATCH',
        body: { status: newStatus, note },
      });
      setMessage(result.message || 'Request status updated.');
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const markRead = async (notificationId) => {
    try {
      await api(`/notifications/${notificationId}/read`, { method: 'PATCH' });
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const statusButtons = (request) => {
    if (request.status === 'submitted') {
      return (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => changeStatus(request, 'in-review')}>Start review</Button>
          <Button size="sm" variant="danger" onClick={() => changeStatus(request, 'rejected')}>Reject</Button>
        </div>
      );
    }
    if (request.status === 'in-review') {
      return (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => changeStatus(request, 'approved')}>Approve</Button>
          <Button size="sm" variant="danger" onClick={() => changeStatus(request, 'rejected')}>Reject</Button>
        </div>
      );
    }
    if (request.status === 'approved') {
      return <Button size="sm" variant="secondary" onClick={() => changeStatus(request, 'resolved')}>Mark resolved</Button>;
    }
    return <span className="text-xs text-blue-400">No further action</span>;
  };

  return (
    <div>
      <PageHeader title="Requests" subtitle="Ask for leave, equipment or documents, and follow what happens next." />
      {error && <Alert>Error: {error}</Alert>}
      {message && <Alert type="success">{message}</Alert>}

      <Card title="Create a request">
        <form onSubmit={submitRequest} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="request-type" className={labelClass}>Request type</label>
            <select id="request-type" name="type" value={form.type} onChange={changeField} required className={inputClass}>
              {requestTypes.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="request-date" className={labelClass}>Date related to the request</label>
            <input id="request-date" name="date" type="date" value={form.date} onChange={changeField} required className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="request-topic" className={labelClass}>Subject</label>
            <input id="request-topic" name="topic" value={form.topic} onChange={changeField} required maxLength={150} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="request-essay" className={labelClass}>Details</label>
            <textarea id="request-essay" name="essay" value={form.essay} onChange={changeField} rows={5} required className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 text-sm text-blue-900">
              <input
                name="aboutManager"
                type="checkbox"
                checked={form.aboutManager}
                onChange={changeField}
                className="h-4 w-4 rounded border-blue-200 text-blue-600"
              />
              This request is about my manager (send it to HR)
            </label>
            <p className="mt-2 text-xs text-blue-900/60">
              Complaints and incidents are sent to HR. Other requests go to your assigned manager.
            </p>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={saving}>{saving ? 'Sending…' : 'Send request'}</Button>
          </div>
        </form>
      </Card>

      <Card title="My requests">
        {myRequests.length === 0 ? <EmptyState>You have not submitted any requests yet.</EmptyState> : (
          <div className="overflow-x-auto">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>Subject</th><th className={thClass}>Type</th><th className={thClass}>Date</th>
                  <th className={thClass}>Status</th><th className={thClass}>Sent to</th><th className={thClass}>Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {myRequests.map((request) => (
                  <tr key={request._id}>
                    <td className={`${tdClass} font-medium text-blue-950`}>{request.topic}</td>
                    <td className={`${tdClass} capitalize`}>{request.type}</td>
                    <td className={tdClass}>{formatDate(request.date)}</td>
                    <td className={tdClass}><StatusBadge status={request.status} /></td>
                    <td className={tdClass}>{request.routeToHR ? 'HR' : request.assignedTo?.email || 'Manager'}</td>
                    <td className={tdClass}>{formatDate(request.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {canReview && (
        <Card title={user.role === 'hr' ? 'HR request inbox' : 'Team request inbox'}>
          {inbox.length === 0 ? <EmptyState>There are no requests waiting in your inbox.</EmptyState> : (
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr>
                    <th className={thClass}>Employee</th><th className={thClass}>Subject</th><th className={thClass}>Type</th>
                    <th className={thClass}>Date</th><th className={thClass}>Details</th><th className={thClass}>Status</th>
                    <th className={thClass}>Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100">
                  {inbox.map((request) => (
                    <tr key={request._id}>
                      <td className={tdClass}>{request.submittedBy?.email || 'Unknown user'}</td>
                      <td className={`${tdClass} font-medium text-blue-950`}>{request.topic}</td>
                      <td className={`${tdClass} capitalize`}>{request.type}</td>
                      <td className={tdClass}>{formatDate(request.date)}</td>
                      <td className={`${tdClass} max-w-xs whitespace-pre-line`}>{request.essay}</td>
                      <td className={tdClass}><StatusBadge status={request.status} /></td>
                      <td className={tdClass}>{statusButtons(request)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <Card title="Notifications">
        {notifications.length === 0 ? <EmptyState>You have no notifications.</EmptyState> : (
          <ul className="divide-y divide-blue-100">
            {notifications.map((notification) => (
              <li key={notification._id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <span className={notification.readAt ? 'text-blue-900/60' : 'font-medium text-blue-950'}>
                  <Badge tone={notification.readAt ? 'gray' : 'blue'}>{notification.readAt ? 'Read' : 'Unread'}</Badge>{' '}
                  {notification.message} — {formatDate(notification.createdAt)}
                </span>
                {!notification.readAt && (
                  <Button size="sm" variant="secondary" onClick={() => markRead(notification._id)}>Mark as read</Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

export default Requests;
