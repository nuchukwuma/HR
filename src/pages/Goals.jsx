import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { Alert, Badge, Button, Card, EmptyState, PageHeader } from '../components/ui';
import { inputClass, labelClass } from '../utils/styles';

// One goal: a progress bar, and a box to update how far along it is
function GoalItem({ goal, onChanged }) {
  const { user } = useAuth();
  const [value, setValue] = useState(goal.current);
  const [error, setError] = useState('');

  const canDelete = user.role === 'hr' || goal.createdBy === user._id;
  const isMine = goal.owner._id === user._id;
  const done = goal.status === 'completed';

  const saveProgress = async (e) => {
    e.preventDefault();
    try {
      await api(`/goals/${goal._id}/progress`, { method: 'PATCH', body: { current: value } });
      setError('');
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    try {
      await api(`/goals/${goal._id}`, { method: 'DELETE' });
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <article className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-blue-950">{goal.title}</h3>
        <Badge tone={done ? 'green' : 'blue'}>{done ? 'Completed' : 'In progress'}</Badge>
      </div>

      <p className="mt-1 text-xs text-blue-900/60">
        {!isMine && <>Owner: {goal.owner.email}</>}
        {!isMine && goal.dueDate && ' · '}
        {goal.dueDate && <>Due {new Date(goal.dueDate).toLocaleDateString()}</>}
      </p>
      {goal.description && <p className="mt-2 text-sm text-blue-900/80">{goal.description}</p>}

      {/* The progress bar: a grey track with a blue bar whose width is the percentage */}
      <div className="mt-4">
        <div className="mb-1 flex items-baseline justify-between text-sm">
          <span className="font-semibold text-blue-950">{goal.percent}%</span>
          <span className="text-xs text-blue-900/60">
            {goal.current} of {goal.target}
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={goal.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-2 overflow-hidden rounded-full bg-blue-100"
        >
          <div
            className={`h-full rounded-full ${done ? 'bg-green-500' : 'bg-blue-600'}`}
            style={{ width: `${goal.percent}%` }}
          />
        </div>
      </div>

      <form onSubmit={saveProgress} className="mt-4 flex flex-wrap items-end gap-2">
        <div>
          <label htmlFor={`progress-${goal._id}`} className={labelClass}>
            Progress so far
          </label>
          <input
            id={`progress-${goal._id}`}
            type="number"
            min="0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className={`${inputClass} w-28`}
          />
        </div>
        <Button type="submit" size="sm" className="mb-0.5">Save</Button>
        {canDelete && (
          <Button variant="danger" size="sm" className="mb-0.5" onClick={handleDelete}>
            Delete
          </Button>
        )}
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </article>
  );
}

function Goals() {
  const { user } = useAuth();
  const canAssign = user.role === 'manager' || user.role === 'hr';

  const [goals, setGoals] = useState([]);
  const [people, setPeople] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [target, setTarget] = useState(100);
  const [dueDate, setDueDate] = useState('');
  const [ownerId, setOwnerId] = useState('');

  useEffect(() => {
    api('/goals')
      .then((data) => {
        setGoals(data.goals);
        setError('');
      })
      .catch((err) => setError(err.message));
  }, [reloadKey]);

  // Managers and HR can choose whose goal it is
  useEffect(() => {
    if (!canAssign) return;
    api('/shifts/people').then((data) => setPeople(data.people)).catch(() => {});
  }, [canAssign]);

  const reload = () => setReloadKey((k) => k + 1);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api('/goals', { method: 'POST', body: { title, target, dueDate, ownerId } });
      setTitle('');
      setTarget(100);
      setDueDate('');
      setOwnerId('');
      setError('');
      reload();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <PageHeader title="Goals"  />
      {error && <Alert>{error}</Alert>}

      <Card title="New goal">
        <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="goal-title" className={labelClass}>Title</label>
            <input id="goal-title" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          </div>

          <div>
            <label htmlFor="goal-target" className={labelClass}>Target (the number that means "done")</label>
            <input
              id="goal-target"
              type="number"
              min="1"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="goal-due" className={labelClass}>Due date (optional)</label>
            <input
              id="goal-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputClass}
            />
          </div>

          {canAssign && (
            <div className="sm:col-span-2">
              <label htmlFor="goal-owner" className={labelClass}>Goal for</label>
              <select id="goal-owner" value={ownerId} onChange={(e) => setOwnerId(e.target.value)} className={inputClass}>
                <option value="">Myself</option>
                {people.map((p) => (
                  <option key={p._id} value={p._id}>{p.email}</option>
                ))}
              </select>
            </div>
          )}

          <div className="sm:col-span-2">
            <Button type="submit">Create goal</Button>
          </div>
        </form>
      </Card>

      {goals.length === 0 ? (
        <EmptyState>No goals yet.</EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((goal) => (
            <GoalItem key={goal._id} goal={goal} onChanged={reload} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Goals;
