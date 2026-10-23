import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const navItems = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Employee Data', path: '/employee-data' },
  { name: 'Teams', path: '/teams' },
  { name: 'Business Partners', path: '/partners' },
  { name: 'Shift', path: '/shifts' },
  { name: 'Requests', path: '/requests' },
  { name: 'Activity Log', path: '/activity-log' },
  { name: 'Goals', path: '/goals' },
  { name: 'Chat', path: '/chat' },
  { name: 'Posts', path: '/posts' },
];

function Sidebar() {
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation(); 

  return (
    <aside
      className={`relative flex flex-col bg-white border-r border-blue-100 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      } sticky top-0 h-screen shrink-0 p-4`}
    >

      <div className="flex items-center justify-between mb-8 px-2">
        {!isCollapsed && (
          <span className="text-xl font-extrabold text-blue-600 tracking-tight">
            Human Resources HR.M
          </span>
        )}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-expanded={!isCollapsed}
          className="p-2 rounded-lg text-blue-900/60 hover:bg-blue-100 hover:text-blue-950 transition-colors ml-auto"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          )}
        </button>
      </div>


      <nav className="flex-1 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.filter((item) => item.path !== '/teams' || ['manager', 'hr'].includes(user.role)).map((item) => {

        const isActive = location.pathname === item.path;

            return (
              <li key={item.name}>
                <Link
                  to={item.path}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-blue-900/80 hover:bg-blue-100 hover:text-blue-950'
                  }`}
                  title={isCollapsed ? item.name : undefined}
                >
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : 'bg-blue-400'}`} />
                  
                  {!isCollapsed && <span className="truncate text-sm">{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>


      {!isCollapsed && (
        <div className="mt-2 rounded-lg bg-blue-50 px-3 py-2">
          <p className="text-xs capitalize text-blue-900/60">{user.role}</p>
        </div>
      )}


      <div className="pt-4 mt-4 border-t border-blue-100">
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-red-600 hover:bg-red-50 transition-colors"
          title={isCollapsed ? 'Logout' : undefined}
        >
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!isCollapsed && <span className="text-sm">Logout</span>}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;