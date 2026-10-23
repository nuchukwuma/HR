import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { Button } from './ui';
import { inputClass } from '../utils/styles';


function ChannelMembers({ channel, onChanged }) {
  const { user } = useAuth();
  const isCreator = channel.createdBy === user._id;

  const [people, setPeople] = useState([]);
  const [chosen, setChosen] = useState('');
  const [error, setError] = useState('');


  useEffect(() => {
    if (!isCreator) return;
    api('/shifts/people').then((data) => setPeople(data.people)).catch(() => {});
  }, [isCreator]);

  const memberIds = channel.members.map((m) => m._id);
  const canAdd = people.filter((p) => !memberIds.includes(p._id));

  const addMember = async () => {
    if (!chosen) return;
    try {
      await api(`/channels/${channel._id}/members`, { method: 'POST', body: { userId: chosen } });
      setChosen('');
      setError('');
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  const removeMember = async (userId) => {
    try {
      await api(`/channels/${channel._id}/members/${userId}`, { method: 'DELETE' });
      setError('');
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <details className="mb-4 rounded-lg border border-blue-100 bg-blue-50 p-3">
      <summary className="cursor-pointer text-sm font-medium text-blue-900">
        Members ({channel.members.length})
      </summary>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <ul className="mt-3 space-y-2">
        {channel.members.map((m) => (
          <li key={m._id} className="flex items-center justify-between gap-2 text-sm text-blue-900">
            <span>
              {m.email}
              {m._id === channel.createdBy && <span className="ml-1 text-xs text-blue-400">(creator)</span>}
            </span>

            {m._id !== channel.createdBy && (isCreator || m._id === user._id) && (
              <Button variant="danger" size="sm" onClick={() => removeMember(m._id)}>
                {m._id === user._id ? 'Leave' : 'Remove'}
              </Button>
            )}
          </li>
        ))}
      </ul>

      {isCreator && (
        <div className="mt-3 flex gap-2">
          <select value={chosen} onChange={(e) => setChosen(e.target.value)} aria-label="Person to add" className={inputClass}>
            <option value="">Add a person...</option>
            {canAdd.map((p) => (
              <option key={p._id} value={p._id}>{p.email}</option>
            ))}
          </select>
          <Button variant="secondary" onClick={addMember}>Add</Button>
        </div>
      )}
    </details>
  );
}

export default ChannelMembers;
