import { useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { initials } from '../lib/utils';
import { Icon, Spinner } from '../components/ui';

export default function Account() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' });
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [busy, setBusy] = useState('');

  const saveProfile = async (e) => {
    e.preventDefault();
    setBusy('profile');
    try {
      const d = await api.put('/auth/profile', profile);
      setUser(d.user);
      toast.success('Profile updated');
    } catch (err) { toast.error(err.message); } finally { setBusy(''); }
  };
  const savePassword = async (e) => {
    e.preventDefault();
    if (pw.next !== pw.confirm) return toast.error('New passwords do not match.');
    setBusy('pw');
    try {
      await api.put('/auth/password', { current: pw.current, next: pw.next });
      setPw({ current: '', next: '', confirm: '' });
      toast.success('Password changed');
    } catch (err) { toast.error(err.message); } finally { setBusy(''); }
  };

  return (
    <div className="max-w-4xl row g-4">
      <div className="col-lg-6">
        <form onSubmit={saveProfile} className="h-full rounded-2xl bg-white p-6 ring-1 ring-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <span className="grid place-items-center h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-800 font-heading text-xl font-bold text-white">{initials(user?.name)}</span>
            <div><h3 className="m-0 text-lg font-bold">{user?.name}</h3><span className="badge badge-soft capitalize">{user?.role}</span></div>
          </div>
          <label className="form-label">Full name</label>
          <input className="form-control mb-3" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
          <label className="form-label">Email</label>
          <input type="email" className="form-control mb-4" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
          <button className="btn btn-primary !rounded-xl flex items-center gap-2" disabled={busy === 'profile'}>{busy === 'profile' ? <Spinner className="!h-4 !w-4" /> : <Icon name="check2" />}Save profile</button>
        </form>
      </div>
      <div className="col-lg-6">
        <form onSubmit={savePassword} className="h-full rounded-2xl bg-white p-6 ring-1 ring-slate-100 shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Icon name="key" className="text-brand-600" />Change password</h3>
          <label className="form-label">Current password</label>
          <input type="password" autoComplete="current-password" className="form-control mb-3" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
          <label className="form-label">New password</label>
          <input type="password" autoComplete="new-password" className="form-control mb-3" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
          <label className="form-label">Confirm new password</label>
          <input type="password" autoComplete="new-password" className="form-control mb-4" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
          <button className="btn btn-primary !rounded-xl flex items-center gap-2" disabled={busy === 'pw' || pw.next.length < 8}>{busy === 'pw' ? <Spinner className="!h-4 !w-4" /> : <Icon name="shield-check" />}Update password</button>
        </form>
      </div>
    </div>
  );
}
