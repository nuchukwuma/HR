import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import SocketProvider from './SocketProvider';


function Layout() {
  return (


    <SocketProvider>
      <div className="flex min-h-screen bg-blue-50">
        
        <Sidebar />

        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl p-6 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </SocketProvider>
  );
}

export default Layout;
