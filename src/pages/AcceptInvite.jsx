import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../utils/api';
import { Alert, Button } from '../components/ui';
import { inputClass, labelClass } from '../utils/styles';

function AcceptInvite() {
  const { token } = useParams(); 
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api('/auth/accept-invite', {
        method: 'POST',
        body: { token, password },
      });
      setDone(true);
    } catch (err) {
      setError(err.message); 
    }
  };


  const box = 'flex min-h-screen items-center justify-center bg-blue-50 p-4';
  const card = 'w-full max-w-md rounded-xl border border-blue-100 bg-white p-8 shadow-sm';

  if (done) {
    return (
      <div className={box}>
        <div className={card}>
          <h1 className="mb-2 text-2xl font-bold text-blue-950">Your account is ready</h1>
          <p className="mb-6 text-sm text-blue-900/60">You can now log in with your new password.</p>
          <Link to="/login" className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            Go to log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={box}>
      <form onSubmit={handleSubmit} className={`${card} space-y-4`}>
        <h1 className="text-2xl font-bold text-blue-950">Set your password</h1>

        <div>
          <label htmlFor="password" className={labelClass}>New password (at least 8 characters)</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </div>

        {error && <Alert>{error}</Alert>}

        <Button type="submit" className="w-full">Save password</Button>
      </form>
    </div>
  );
}

export default AcceptInvite;
