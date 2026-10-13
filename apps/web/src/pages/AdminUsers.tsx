import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiClient';
import { getStoredUser } from '../lib/session';
import { Card } from '../components/Card';

type AdminUser = {
  id: number;
  full_name: string;
  email: string;
  role: string;
  is_suspended: boolean;
  created_at: string | null;
};

function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const isAdmin = getStoredUser()?.role === 'admin';

  const loadUsers = useCallback(async () => {
    setError('');
    try {
      const response = await apiFetch('/api/admin/users');
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Unable to load users.');
      setUsers(payload.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) void loadUsers();
    else setLoading(false);
  }, [isAdmin, loadUsers]);

  async function setSuspension(user: AdminUser, suspended: boolean) {
    setSavingUserId(user.id);
    setError('');
    try {
      const response = await apiFetch(`/api/admin/users/${user.id}/suspension`, {
        method: 'PATCH',
        body: JSON.stringify({ suspended }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Unable to update account status.');
      setUsers((current) => current.map((entry) => entry.id === user.id
        ? { ...entry, is_suspended: suspended }
        : entry));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update account status.');
    } finally {
      setSavingUserId(null);
    }
  }

  return (
    <section className="workspace-page">
      <div className="container workspace-stack">
        <div className="section-block">
          <h1>User administration</h1>
          <p className="page-description">Review accounts and suspend or restore student access.</p>
        </div>
        {!isAdmin ? <p role="alert">Administrator access is required to manage accounts.</p> : null}
        {error ? <p role="alert" className="form-error">{error}</p> : null}
        {isAdmin && loading ? <p>Loading users…</p> : null}
        {isAdmin && !loading && users.length === 0 && !error ? <p>No accounts are available.</p> : null}
        {isAdmin && users.length > 0 ? (
          <div className="detail-panel" role="region" aria-label="User accounts">
            <div className="admin-user-list">
              {users.map((user) => (
                <Card variant="outlined" className="admin-user-row" key={user.id}>
                  <div>
                    <h2>{user.full_name}</h2>
                    <p>{user.email}</p>
                    <p>{user.role} · {user.is_suspended ? 'Suspended' : 'Active'}</p>
                  </div>
                  {user.role === 'admin' ? <span>Administrator</span> : (
                    <button
                      type="button"
                      className={user.is_suspended ? 'button button-secondary' : 'button button-primary'}
                      disabled={savingUserId === user.id}
                      onClick={() => setSuspension(user, !user.is_suspended)}
                    >
                      {savingUserId === user.id
                        ? 'Saving…'
                        : user.is_suspended ? 'Restore access' : 'Suspend account'}
                    </button>
                  )}
                </Card>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default AdminUsers;
