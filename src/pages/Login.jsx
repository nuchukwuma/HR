import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';

function Login() {
  const { user, setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Already logged in? Go to the dashboard.
  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await api('auth/login', { method: 'POST', body: { email, password } });
      setUser(res.user || res);
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="flex flex-col md:flex-row max-w-6xl w-full bg-white rounded-xl overflow-hidden p-12 gap-8 items-center">
        
        {/* Left Section: Marketing Promo */}
        <section className="flex-1 space-y-10 p-8 rounded-xl text-white">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">HR.M</h1>
          <p className="text-gray-600 leading-relaxed">
            Take the hassle out of onboarding, employee tracking, and workforce operations with a simple, secure, and modern HR platform. Save time, empower your team, and focus on what matters most—growing your people and your business.
          </p>
        </section>

        {/* Vertical Divider (Visible on desktop) */}
        <div className="hidden md:block w-px bg-gray-200 self-stretch"></div>

        {/* Right Section: Form */}
        <section className="flex-1 w-full">
          <form onSubmit={handleSubmit} className="space-y-10">
            <h1 className="text-2xl font-bold text-gray-800">Log in</h1>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Log in
            </button>
          </form>
        </section>

      </div>
    </div>
  );
}

export default Login;