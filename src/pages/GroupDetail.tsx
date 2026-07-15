import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../assets/images/api';

function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    apiFetch(`/api/groups/${id}`)
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
    if (!raw || !localStorage.getItem('token')) {
      navigate('/login');
      return;
    }

    try {
      const res = await apiFetch(`/api/groups/${id}/enroll`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed');
      const refreshed = await apiFetch(`/api/groups/${id}`);
      const data = await refreshed.json();
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
        <p><strong>Members:</strong> {group.members || (group.membersList && group.membersList.length) || 0}</p>
        <p><strong>How we meet:</strong> {group.meetingType || 'Hybrid / Check schedule'}</p>
        <p><strong>Who can join:</strong> {group.whoCanJoin || 'Students enrolled in the related course or approved by a moderator.'}</p>
        <p><strong>Communication:</strong> {group.communicationChannel || 'Dashboard announcements and a shared study chat.'}</p>
      </div>

      <div className="group-actions">
        <button className="button button-primary" onClick={handleJoin}>Join this group</button>
      </div>

      <section className="group-section">
        <h2>What to expect</h2>
        <p>
          {group.description || 'This group focuses on collaborative learning, regular practice sessions, and shared resources.'}
        </p>
        <p>
          {group.scheduleNotes || 'Specific meeting times, course tasks, and participation expectations are posted by the group owner.'}
        </p>
      </section>

      <section className="group-section">
        <h2>New member requirements</h2>
        {group.joinRequirements && group.joinRequirements.length > 0 ? (
          <ul>
            {group.joinRequirements.map((item: string) => <li key={item}>{item}</li>)}
          </ul>
        ) : (
          <p>Read the welcome notes, attend the orientation, and introduce yourself to the group.</p>
        )}
      </section>

      <section className="group-section">
        <h2>Rules and regulations</h2>
        {group.groupRules && group.groupRules.length > 0 ? (
          <ul>
            {group.groupRules.map((item: string) => <li key={item}>{item}</li>)}
          </ul>
        ) : (
          <p>Be respectful, keep discussions academic, and follow the moderator's instructions.</p>
        )}
      </section>

      <section className="group-section">
        <h2>What you get when you join</h2>
        {group.memberBenefits && group.memberBenefits.length > 0 ? (
          <ul>
            {group.memberBenefits.map((item: string) => <li key={item}>{item}</li>)}
          </ul>
        ) : (
          <p>Shared notes, peer support, scheduled sessions, and structured academic help.</p>
        )}
      </section>

      <section className="group-section">
        <h2>First week checklist</h2>
        {group.newMemberSteps && group.newMemberSteps.length > 0 ? (
          <ul>
            {group.newMemberSteps.map((item: string) => <li key={item}>{item}</li>)}
          </ul>
        ) : (
          <p>Introduce yourself, review the study plan, and join the first meeting.</p>
        )}
      </section>

      <section className="group-section">
        <h2>Enrolled students</h2>
        {group.membersList && group.membersList.length > 0 ? (
          <ul>
            {group.membersList.map((u: any) => (
              <li key={u.email}>{u.name} — {u.email} — {new Date(u.enrolledAt).toLocaleString()}</li>
            ))}
          </ul>
        ) : (
          <p>No members yet. Be the first to join.</p>
        )}
      </section>

      <section className="group-section">
        <h2>Related sessions</h2>
        <RelatedSessions sessions={group.sessions || []} />
      </section>
    </section>
  );
}

function RelatedSessions({ sessions }: { sessions: any[] }) {
  if (!sessions.length) return <p>No related sessions found.</p>;

  return (
    <ul>
      {sessions.map((s) => (
        <li key={s.id}>
          {s.title} — {s.time} — Enrolled: {s.enrolledCount || 0}
          {s.prepNotes && s.prepNotes.length > 0 ? ` — Prep: ${s.prepNotes[0]}` : ''}
        </li>
      ))}
    </ul>
  );
}

export default GroupDetail;
