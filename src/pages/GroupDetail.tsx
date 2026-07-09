import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/groups/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then((data) => setGroup(data.group))
      .catch(() => setGroup(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleJoin = async () => {
    const raw = localStorage.getItem('user');
    if (!raw) {
      navigate('/login');
      return;
    }
    const user = JSON.parse(raw);
    try {
      const res = await fetch(`/api/groups/${id}/enroll`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user }) });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setGroup(data.group);
      alert('Joined group');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      alert('Failed to join group');
    }
  };

  if (loading) return <div className="container"><p>Loading group…</p></div>;
  if (!group) return <div className="container"><p>Group not found.</p></div>;

  return (
    <section className="group-detail container">
      <div className="page-header">
        <h1>{group.name}</h1>
        <p className="page-description">{group.description}</p>
      </div>

      <div className="group-meta">
        <p><strong>Members:</strong> {(group.enrollments && group.enrollments.length) || 0}</p>
        <p><strong>How we meet:</strong> {group.meeting || 'Hybrid / Check schedule'}</p>
      </div>

      <div className="group-actions">
        <button className="button button-primary" onClick={handleJoin}>Join this group</button>
      </div>

      <section className="group-section">
        <h2>What to expect</h2>
        <p>
          This group focuses on collaborative learning, regular practice sessions, and shared resources.
          Before joining, expect weekly meetings, a shared channel for coordination, and a study plan.
        </p>
        <p>
          Specific meeting times and course tasks are posted by the group owner. Participation expectations and code of conduct
          are maintained in the group's pinned notes.
        </p>
      </section>

      <section className="group-section">
        <h2>Enrolled students</h2>
        {group.enrollments && group.enrollments.length > 0 ? (
          <ul>
            {group.enrollments.map((u: any) => (
              <li key={u.email}>{u.name} — {u.email} — {new Date(u.enrolledAt).toLocaleString()}</li>
            ))}
          </ul>
        ) : (
          <p>No members yet. Be the first to join.</p>
        )}
      </section>

      <section className="group-section">
        <h2>Related sessions</h2>
        <RelatedSessions groupName={group.name} />
      </section>
    </section>
  );
}

function RelatedSessions({ groupName }: { groupName: string }) {
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/sessions')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.sessions) {
          setSessions(data.sessions.filter((s: any) => String(s.group || '').toLowerCase().includes(groupName.toLowerCase())));
        }
      })
      .catch(() => setSessions([]));
  }, [groupName]);

  if (!sessions.length) return <p>No related sessions found.</p>;

  return (
    <ul>
      {sessions.map((s) => (
        <li key={s.id}>{s.title} — {s.time} — Enrolled: {(s.enrollments && s.enrollments.length) || 0}</li>
      ))}
    </ul>
  );
}

export default GroupDetail;
