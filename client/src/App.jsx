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
import Portal from './pages/Portal';
import PromoPage from './pages/PromoPage';
import { Icon } from './components/ui';
import { ADMIN_URL, STATIC } from './lib/api';

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
  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 p-6 text-center">
      <div className="max-w-md">
        <span className="inline-grid place-items-center h-16 w-16 rounded-2xl bg-brand-600 text-white text-3xl shadow-glow"><Icon name="shield-lock" /></span>
        <h1 className="mt-5 text-2xl font-extrabold">Staff sign-in</h1>
        <p className="text-slate-500">This is the public website. Content is managed on the school&apos;s main system.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {ADMIN_URL && <a href={`${ADMIN_URL}/portal`} className="btn-brand">Go to the admin portal <Icon name="box-arrow-up-right" /></a>}
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
  if (admin && !isAdmin) return <Navigate to="/admin" replace />;
  return children;
}

function ServerError({ message, retry }) {
  return (
    <div className="min-h-screen grid place-items-center p-6 text-center">
      <div>
        <Icon name="cloud-slash" className="text-6xl text-brand-300" />
        <h1 className="mt-4 text-2xl font-bold">We can’t reach the school server</h1>
        <p className="text-slate-500">{message}</p>
        <button onClick={retry} className="btn-brand mt-2"><Icon name="arrow-clockwise" />Try again</button>
      </div>
    </div>
  );
}

export default function App() {
  const { loading, installed, error, settings, reload } = useSite();
  const { pathname } = useLocation();

  if (loading) return <Preloader />;
  if (error && !settings) return <ServerError message={error} retry={reload} />;
  if (!installed && pathname !== '/setup') return <Navigate to="/setup" replace />;

  return (
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
          {/* Promotion pages live at addresses the admin chooses; anything else is a 404. */}
          <Route path="*" element={<PromoPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
