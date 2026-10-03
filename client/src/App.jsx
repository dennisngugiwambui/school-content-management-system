import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useSite } from './context/SiteContext';
import { useAuth } from './context/AuthContext';
import Preloader from './components/Preloader';
import PublicLayout from './components/layout/PublicLayout';
import Home from './pages/Home';
import About from './pages/About';
import Departments from './pages/Departments';
import DepartmentDetail from './pages/DepartmentDetail';
import Structure from './pages/Structure';
import Staff from './pages/Staff';
import Prefects from './pages/Prefects';
import Gallery from './pages/Gallery';
import Results from './pages/Results';
import Fees from './pages/Fees';
import Tenders from './pages/Tenders';
import { NewsList, NewsDetail } from './pages/News';
import Portal, { SchoolPortalCard } from './pages/Portal';
import PromoPage from './pages/PromoPage';
import ErrorPage, { ErrorBoundary } from './pages/ErrorPage';
import { ERROR_PAGES, errorCode } from './lib/errors';
import { Icon } from './components/ui';
import { ADMIN_URL, STATIC, portalHasLinks } from './lib/api';

// The CMS is split into its own bundle so public visitors never download it.
const Setup = lazy(() => import('./pages/Setup'));
const AdminLayout = lazy(() => import('./admin/AdminLayout'));
const Dashboard = lazy(() => import('./admin/Dashboard'));
const ContentEditor = lazy(() => import('./admin/ContentEditor'));
const SettingsPage = lazy(() => import('./admin/SettingsPage'));
const GalleryAdmin = lazy(() => import('./admin/GalleryAdmin'));
const Account = lazy(() => import('./admin/Account'));
const ResourcePage = lazy(() => import('./admin/ResourcePage'));

/** On the static (GitHub Pages) site there is no server, so sign-in lives on the main CMS. */
function StaticPortal() {
  const { page, fill } = useSite();
  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 p-6 text-center">
      <div className="max-w-md">
        <span className="inline-grid place-items-center h-16 w-16 rounded-2xl bg-brand-600 text-white text-3xl shadow-glow"><Icon name="shield-lock" /></span>
        <h1 className="mt-5 text-2xl font-extrabold">Sign in</h1>
        <p className="text-slate-500">
          {portalHasLinks(page('portal')) ? 'This is the public website. Choose where you want to sign in.' : 'Online sign-in is not available yet. Please contact the school office.'}
        </p>
        <SchoolPortalCard cfg={page('portal')} fill={fill} />
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {ADMIN_URL && <a href={`${ADMIN_URL}/portal`} className="btn-brand">Website admin <Icon name="box-arrow-up-right" /></a>}
          <a href={import.meta.env.BASE_URL} className="btn-outline-brand">Back to website</a>
        </div>
      </div>
    </div>
  );
}

function RequireAuth({ children, admin = false }) {
  const { user, checking, isAdmin } = useAuth();
  const location = useLocation();
  if (checking) return <Preloader label="Checking session" />;
  if (!user) return <Navigate to="/portal" replace state={{ from: location.pathname }} />;
  if (admin && !isAdmin) return <ErrorPage code="403" />;
  return children;
}

function ServerError({ error, retry }) {
  const code = errorCode(error);
  // A plain network failure means the server is down or asleep rather than the visitor being offline.
  return <ErrorPage code={code === 'offline' && navigator.onLine ? '503' : code} fullScreen onRetry={retry} />;
}

export default function App() {
  const { loading, installed, error, errorStatus, settings, reload } = useSite();
  const { pathname } = useLocation();

  if (loading) return <Preloader />;
  if (error && !settings) return <ServerError error={{ message: error, status: errorStatus }} retry={reload} />;
  if (!installed && pathname !== '/setup') return <Navigate to="/setup" replace />;

  return (
    <ErrorBoundary key={pathname}>
      <Suspense fallback={<Preloader />}>
        <Routes>
          <Route path="/setup" element={installed ? <Navigate to="/" replace /> : <Setup />} />
          <Route path="/portal" element={STATIC ? <StaticPortal /> : <Portal />} />
          {['/login', '/signin', '/admin/login'].map((p) => <Route key={p} path={p} element={<Navigate to="/portal" replace />} />)}
          {STATIC && <Route path="/admin/*" element={<StaticPortal />} />}
          {!STATIC && <Route path="/admin" element={<RequireAuth><AdminLayout /></RequireAuth>}>
            <Route index element={<Dashboard />} />
            <Route path="content/:key" element={<ContentEditor />} />
            <Route path="settings" element={<RequireAuth admin><SettingsPage /></RequireAuth>} />
            <Route path="users" element={<RequireAuth admin><ResourcePage kind="users" /></RequireAuth>} />
            <Route path="departments" element={<ResourcePage kind="departments" />} />
            <Route path="staff" element={<ResourcePage kind="staff" />} />
            <Route path="prefects" element={<ResourcePage kind="prefects" />} />
            <Route path="news" element={<ResourcePage kind="news" />} />
            <Route path="tenders" element={<ResourcePage kind="tenders" />} />
            <Route path="gallery" element={<GalleryAdmin />} />
            <Route path="account" element={<Account />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>}
          <Route element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="departments" element={<Departments />} />
            <Route path="departments/:slug" element={<DepartmentDetail />} />
            <Route path="structure" element={<Structure />} />
            <Route path="staff" element={<Staff />} />
            <Route path="prefects" element={<Prefects />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="results" element={<Results />} />
            <Route path="fees" element={<Fees />} />
            <Route path="tenders" element={<Tenders />} />
            <Route path="news" element={<NewsList />} />
            <Route path="news/:slug" element={<NewsDetail />} />
            {ERROR_PAGES.map((c) => <Route key={c} path={c} element={<ErrorPage code={c} />} />)}
            {/* Promotion pages live at addresses the admin chooses; anything else is a 404. */}
            <Route path="*" element={<PromoPage />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
