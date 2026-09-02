import { Suspense, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Breadcrumbs from './Breadcrumbs';
import PageSkeleton from '../components/PageSkeleton';
import usePageTitle from '../hooks/usePageTitle';

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  usePageTitle();

  return (
    <div className="min-h-screen flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 min-w-0 flex flex-col lg:pl-64">
        <Topbar onOpenSidebar={() => setSidebarOpen(true)} />

        <main className="relative flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 w-full max-w-[1600px] mx-auto">
          <Breadcrumbs />
          <Suspense
            fallback={<PageSkeleton variant="list" />}
          >
            {/* Keyed by path so each real navigation re-triggers the fade
               (React remounts the div instead of leaving the old one in
               place), giving the SPA the same quiet cross-fade the
               server-rendered pages get from the View Transitions API. */}
            <div key={location.pathname} className="fade-in-up">
              <Outlet />
            </div>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
