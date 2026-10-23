import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { Alert, Button, Card } from './ui';
import { inputClass, labelClass } from '../utils/styles';


function PostForm({ onCreated }) {
  const { user } = useAuth();
  const isHr = user.role === 'hr';

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState(isHr ? 'company' : 'team');
  const [teamId, setTeamId] = useState('');
  const [teams, setTeams] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isHr) return;
    api('/teams').then((data) => setTeams(data.teams)).catch(() => {});
  }, [isHr]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api('/posts', { method: 'POST', body: { title, body, audience, teamId } });
      setTitle('');
      setBody('');
      setError('');
      onCreated();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Card title="New post">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert>{error}</Alert>}

        <div>
          <label htmlFor="post-title" className={labelClass}>Title</label>
          <input id="post-title" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </div>

        <div>
          <label htmlFor="post-body" className={labelClass}>Message</label>
          <textarea
            id="post-body"
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className={inputClass}
          />
        </div>

        {isHr ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="post-audience" className={labelClass}>Who can see it?</label>
              <select
                id="post-audience"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className={inputClass}
              >
                <option value="company">The whole company</option>
                <option value="team">One team</option>
              </select>
            </div>

            {audience === 'team' && (
              <div>
                <label htmlFor="post-team" className={labelClass}>Team</label>
                <select id="post-team" value={teamId} onChange={(e) => setTeamId(e.target.value)} className={inputClass}>
                  <option value="">Choose a team</option>
                  {teams.map((t) => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-blue-900/60">This post will be seen by your team.</p>
        )}

        <Button type="submit">Post</Button>
      </form>
    </Card>
  );
}

export default PostForm;
