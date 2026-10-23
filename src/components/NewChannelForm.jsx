import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { Alert, Button, Card } from './ui';
import { inputClass, labelClass } from '../utils/styles';


function NewChannelForm({ onCreated }) {
  const { user } = useAuth();
  const [type, setType] = useState('group');
  const [name, setName] = useState('');
  const [teamId, setTeamId] = useState('');
  const [memberIds, setMemberIds] = useState([]);
  const [teams, setTeams] = useState([]);
  const [people, setPeople] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/teams').then((data) => setTeams(data.teams)).catch(() => {});
    api('/shifts/people').then((data) => setPeople(data.people)).catch(() => {});
  }, []);

  const toggleMember = (id) => {
    setMemberIds((old) => (old.includes(id) ? old.filter((x) => x !== id) : [...old, id]));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await api('/channels', {
        method: 'POST',
        body: { name, type, teamId, memberIds },
      });
      onCreated(data.channel);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Card title="New channel">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="channel-type" className={labelClass}>Type</label>
          <select id="channel-type" value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
            <option value="group">Group (private, you choose the members)</option>
            <option value="team">Team channel</option>
          </select>
        </div>

        <div>
          <label htmlFor="channel-name" className={labelClass}>Name {type === 'team' && '(optional)'}</label>
          <input id="channel-name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>

        {type === 'team' && user.role === 'hr' && (
          <div>
            <label htmlFor="channel-team" className={labelClass}>Team</label>
            <select id="channel-team" value={teamId} onChange={(e) => setTeamId(e.target.value)} className={inputClass}>
              <option value="">Choose a team</option>
              {teams.map((t) => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}
        {type === 'team' && user.role === 'manager' && (
          <p className="text-sm text-blue-900/60">The channel will be for your own team.</p>
        )}

        {type === 'group' && (
          <fieldset className="rounded-lg border border-blue-100 p-3">
            <legend className="px-1 text-sm font-medium text-blue-900">Members (you are added automatically)</legend>
            {people.length === 0 && <p className="text-sm text-blue-900/60">No people to add yet.</p>}
            <div className="space-y-2">
              {people.map((p) => (
                <label key={p._id} className="flex items-center gap-2 text-sm text-blue-900">
                  <input
                    type="checkbox"
                    checked={memberIds.includes(p._id)}
                    onChange={() => toggleMember(p._id)}
                    className="h-4 w-4 rounded border-blue-200 text-blue-600"
                  />
                  {p.email}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {error && <Alert>{error}</Alert>}
        <Button type="submit">Create channel</Button>
      </form>
    </Card>
  );
}

export default NewChannelForm;
