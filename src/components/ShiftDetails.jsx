import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { Alert, Badge, Button, Card } from './ui';
import { inputClass } from '../utils/styles';

const CLOCK_IN_EARLY_MS = 30 * 60 * 1000;

function ShiftDetails({ shift, onChanged, onClose }) {
  const { user } = useAuth();
  const [now] = useState(() => new Date()); 
  const [people, setPeople] = useState([]);
  const [swapWith, setSwapWith] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const start = new Date(shift.startTime);
  const end = new Date(shift.endTime);

  const isMine = shift.userId._id === user._id;
  const canManage = user.role === 'manager' || user.role === 'hr';
  const unstarted = shift.status === 'scheduled' && !shift.clockIn;

  const canClockIn =
    isMine &&
    unstarted &&
    now >= new Date(start.getTime() - CLOCK_IN_EARLY_MS) &&
    now <= end;
  const canClockOut = isMine && shift.clockIn && !shift.clockOut;
  const canSwap = isMine && unstarted && start > now;
  const canCancel = canManage && unstarted;

  useEffect(() => {
    if (!canSwap) return;
    api('/shifts/people')
      .then((data) => setPeople(data.people))
      .catch((err) => setError(err.message));
  }, [canSwap]);

  const run = async (action, successMessage) => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await action();
      setMessage(successMessage);
      onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = () => {
    if (!window.confirm('Cancel this shift?')) return;
    run(() => api(`/shifts/${shift._id}`, { method: 'DELETE' }), 'Shift cancelled');
  };

  const statusTone = { scheduled: 'blue', completed: 'green', cancelled: 'red', missed: 'amber' };

  return (
    <Card title="Shift details">
      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <div><dt className="text-blue-900/60">Employee</dt><dd className="font-medium text-blue-950">{shift.userId.email}</dd></div>
        <div><dt className="text-blue-900/60">Status</dt><dd><Badge tone={statusTone[shift.status] || 'gray'}>{shift.status}</Badge></dd></div>
        <div><dt className="text-blue-900/60">Start</dt><dd className="text-blue-950">{start.toLocaleString()}</dd></div>
        <div><dt className="text-blue-900/60">End</dt><dd className="text-blue-950">{end.toLocaleString()}</dd></div>
        {shift.clockIn && (
          <div><dt className="text-blue-900/60">Clocked in</dt><dd className="text-blue-950">{new Date(shift.clockIn).toLocaleTimeString()}</dd></div>
        )}
        {shift.clockOut && (
          <div><dt className="text-blue-900/60">Clocked out</dt><dd className="text-blue-950">{new Date(shift.clockOut).toLocaleTimeString()}</dd></div>
        )}
        {shift.workedHours != null && (
          <div><dt className="text-blue-900/60">Hours worked</dt><dd className="text-blue-950">{shift.workedHours}</dd></div>
        )}
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        {canClockIn && (
          <Button
            disabled={busy}
            onClick={() => run(() => api(`/shifts/${shift._id}/clock-in`, { method: 'POST' }), 'Clocked in')}
          >
            Clock in
          </Button>
        )}

        {canClockOut && (
          <Button
            disabled={busy}
            onClick={() => run(() => api(`/shifts/${shift._id}/clock-out`, { method: 'POST' }), 'Clocked out')}
          >
            Clock out
          </Button>
        )}

        {canCancel && (
          <Button variant="danger" disabled={busy} onClick={handleCancel}>
            Cancel shift
          </Button>
        )}

        <Button variant="secondary" onClick={onClose}>Close</Button>
      </div>

      {canSwap && (
        <div className="mt-5 border-t border-blue-100 pt-4">
          <h3 className="mb-2 text-sm font-semibold text-blue-950">Request a swap</h3>
          <div className="flex flex-wrap gap-2">
            <select
              value={swapWith}
              onChange={(e) => setSwapWith(e.target.value)}
              aria-label="Swap with"
              className={`${inputClass} sm:w-60`}
            >
              <option value="">Swap with...</option>
              {people.map((p) => (
                <option key={p._id} value={p._id}>{p.email}</option>
              ))}
            </select>
            <input
              placeholder="Reason (optional)"
              aria-label="Reason"
              value={reason}
              maxLength={300}
              onChange={(e) => setReason(e.target.value)}
              className={`${inputClass} sm:flex-1`}
            />
            <Button
              variant="secondary"
              disabled={busy || !swapWith}
              onClick={() =>
                run(
                  () =>
                    api('/shifts/swaps', {
                      method: 'POST',
                      body: { shiftId: shift._id, swapWith, reason },
                    }),
                  'Swap request sent'
                )
              }
            >
              Send request
            </Button>
          </div>
        </div>
      )}

      <div className="mt-3">
        {message && <Alert type="success">{message}</Alert>}
        {error && <Alert>{error}</Alert>}
      </div>
    </Card>
  );
}

export default ShiftDetails;
