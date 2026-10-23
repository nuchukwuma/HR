import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { Alert, Button, Card, EmptyState, PageHeader } from '../components/ui';
import { inputClass, labelClass } from '../utils/styles';

function Teams() {
  const { user } = useAuth();
  const isHr = user.role === 'hr';
  const [teams, setTeams] = useState([]);
  const [managers, setManagers] = useState([]);
  const [members, setMembers] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [memberToAdd, setMemberToAdd] = useState('');
  const [teamName, setTeamName] = useState('');
  const [department, setDepartment] = useState('');
  const [managerId, setManagerId] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadTeams = useCallback(async () => {
    try {
      const { teams: result } = await api('/teams');
      setTeams(result);
      setSelectedTeamId((current) =>
        result.some((team) => team._id === current) ? current : result[0]?._id || ''
      );
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeams();
    if (isHr) {
      api('/employees/managers')
        .then(({ managers: result }) => setManagers(result))
        .catch((err) => setError(err.message));
    }
  }, [isHr, loadTeams]);

  const loadTeamDetails = useCallback(async () => {
    if (!selectedTeamId) {
      setMembers([]);
      setCandidates([]);
      return;
    }
    try {
      const [memberData, candidateData] = await Promise.all([
        api(`/teams/${selectedTeamId}/members`),
        api(`/teams/${selectedTeamId}/candidates`),
      ]);
      setMembers(memberData.members);
      setCandidates(candidateData.candidates);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [selectedTeamId]);

  useEffect(() => {
    loadTeamDetails();
  }, [loadTeamDetails]);

  const selectedTeam = teams.find((team) => team._id === selectedTeamId);

  const createTeam = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const { team } = await api('/teams', {
        method: 'POST',
        body: { name: teamName, dept: department, managerId: managerId || null },
      });
      setTeamName('');
      setDepartment('');
      setManagerId('');
      setShowCreate(false);
      setNotice('Team created');
      setSelectedTeamId(team._id);
      await loadTeams();
      setSelectedTeamId(team._id);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addMember = async (event) => {
    event.preventDefault();
    if (!memberToAdd || !selectedTeamId) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await api(`/teams/${selectedTeamId}/members`, {
        method: 'POST',
        body: { userId: memberToAdd },
      });
      setMemberToAdd('');
      setNotice('Employee added to team');
      await loadTeamDetails();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const removeMember = async (memberId) => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await api(`/teams/${selectedTeamId}/members/${memberId}`, { method: 'DELETE' });
      setNotice('Employee removed from team');
      await loadTeamDetails();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Teams" subtitle="Create teams and manage their members">
        <Button onClick={() => setShowCreate((visible) => !visible)}>
          {showCreate ? 'Close' : 'Create team'}
        </Button>
      </PageHeader>
      {error && <Alert>{error}</Alert>}
      {notice && <Alert type="success">{notice}</Alert>}

      {showCreate && (
        <Card title="New team">
          <form onSubmit={createTeam} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="team-name" className={labelClass}>Team name</label>
              <input id="team-name" value={teamName} onChange={(event) => setTeamName(event.target.value)} className={inputClass} required />
            </div>
            <div>
              <label htmlFor="team-department" className={labelClass}>Department</label>
              <input id="team-department" value={department} onChange={(event) => setDepartment(event.target.value)} className={inputClass} required />
            </div>
            {isHr && (
              <div>
                <label htmlFor="team-manager" className={labelClass}>Team manager</label>
                <select id="team-manager" value={managerId} onChange={(event) => setManagerId(event.target.value)} className={inputClass}>
                  <option value="">No manager assigned</option>
                  {managers.map((manager) => (
                    <option key={manager._id} value={manager._id}>{manager.email}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-end gap-2">
              <Button type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create team'}</Button>
              <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <Card><EmptyState>Loading teams...</EmptyState></Card>
      ) : teams.length === 0 ? (
        <Card><EmptyState>No teams yet.</EmptyState></Card>
      ) : (
        <>
          <Card>
            <label htmlFor="team-select" className={labelClass}>Team</label>
            <select id="team-select" value={selectedTeamId} onChange={(event) => setSelectedTeamId(event.target.value)} className={inputClass}>
              {teams.map((team) => <option key={team._id} value={team._id}>{team.name} · {team.dept}</option>)}
            </select>
            {selectedTeam && (
              <p className="mt-3 text-sm text-blue-900/60">
                Manager: {selectedTeam.managerId?.email || 'Not assigned'}
              </p>
            )}
          </Card>

          {selectedTeam && (
            <Card title="Team members">
              <form onSubmit={addMember} className="mb-5 flex flex-wrap items-end gap-3">
                <div className="min-w-56 flex-1">
                  <label htmlFor="team-member" className={labelClass}>Add employee</label>
                  <select id="team-member" value={memberToAdd} onChange={(event) => setMemberToAdd(event.target.value)} className={inputClass} required>
                    <option value="">Select an employee...</option>
                    {candidates.map((candidate) => (
                      <option key={candidate._id} value={candidate._id}>
                        {candidate.name ? `${candidate.name} · ${candidate.email}` : candidate.email}
                      </option>
                    ))}
                  </select>
                </div>
                <Button type="submit" disabled={saving || candidates.length === 0}>Add member</Button>
              </form>
              {members.length === 0 ? (
                <EmptyState>This team has no employees yet.</EmptyState>
              ) : (
                <ul className="divide-y divide-blue-100">
                  {members.map((member) => (
                    <li key={member._id} className="flex items-center justify-between gap-3 py-3">
                      <div>
                        <p className="text-sm font-medium text-blue-950">{member.name || member.email}</p>
                        {member.name && <p className="text-xs text-blue-900/60">{member.email}</p>}
                      </div>
                      <Button type="button" size="sm" variant="secondary" disabled={saving} onClick={() => removeMember(member._id)}>
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}

export default Teams;