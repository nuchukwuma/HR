import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { Alert, Badge, Button, Card, EmptyState } from './ui';

function SwapRequests({ refreshKey, onChanged }) {
  const { user } = useAuth();
  const canReview = user.role === 'manager' || user.role === 'hr';
  const [swaps, setSwaps] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/shifts/swaps')
      .then((data) => setSwaps(data.swaps))
      .catch((err) => setError(err.message));
  }, [refreshKey]);

  const act = async (path, body) => {
    setError('');
    try {
      await api(path, { method: 'PATCH', body });
      onChanged(); 
    } catch (err) {
      setError(err.message);
    }
  };

  const tones = { pending: 'amber', approved: 'green', rejected: 'red', cancelled: 'gray' };

  return (
    <Card title="Swap requests">
      {error && <Alert>{error}</Alert>}
      {swaps.length === 0 && <EmptyState>No swap requests.</EmptyState>}

      <ul className="divide-y divide-blue-100">
        {swaps.map((s) => {
          const isPending = s.status === 'pending';
          const iRequested = s.requestedBy._id === user._id;

          return (
            <li key={s._id} className="py-3 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-blue-950">
                  {s.requestedBy.email} wants {s.swapWith.email} to take{' '}
                  {s.shiftId
                    ? `the shift on ${new Date(s.shiftId.startTime).toLocaleString()}`
                    : 'a deleted shift'}
                </p>
                <Badge tone={tones[s.status] || 'gray'}>{s.status}</Badge>
              </div>
              {s.reason && <p className="mt-1 text-blue-900/60">Reason: {s.reason}</p>}

              <div className="mt-2 flex gap-2">
                {isPending && canReview && !iRequested && (
                  <>
                    <Button size="sm" onClick={() => act(`/shifts/swaps/${s._id}/review`, { decision: 'approved' })}>
                      Approve
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => act(`/shifts/swaps/${s._id}/review`, { decision: 'rejected' })}>
                      Reject
                    </Button>
                  </>
                )}

                {isPending && iRequested && (
                  <Button size="sm" variant="secondary" onClick={() => act(`/shifts/swaps/${s._id}/cancel`)}>
                    Withdraw request
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export default SwapRequests;
