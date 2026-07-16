import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '../assets/images/api';

function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      return;
    }

    apiFetch(`/api/groups/${id}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Not found');
        }
        return response.json();
      })
      .then((data) => setGroup(data.group))
      .catch(() => setGroup(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleJoin = async () => {
    try {
      const response = await apiFetch(`/api/groups/${id}/enroll`, { method: 'POST' });
      if (!response.ok) {
        throw new Error('Failed');
      }

      const refreshed = await apiFetch(`/api/groups/${id}`);
      const data = await refreshed.json();
      setGroup(data.group);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <section className="workspace-page">
        <div className="container workspace-loading-card">
          <p>Loading group...</p>
        </div>
      </section>
    );
  }

  if (!group) {
    return (
      <section className="workspace-page">
        <div className="container workspace-loading-card">
          <p>Group not found.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="workspace-page">
      <div className="container workspace-stack">
        <section className="detail-hero-card">
          <img src={group.image || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80'} alt={group.name} className="detail-hero-image" />
          <div className="detail-hero-copy">
            <p className="workspace-eyebrow">{group.courseCode || 'Study Group'}</p>
            <h1>{group.name}</h1>
            <p className="workspace-lead">{group.description}</p>

            <div className="detail-chip-row">
              <span className="detail-chip">{group.meetingType || 'Hybrid'}</span>
              <span className="detail-chip">{group.members || group.membersList?.length || 0} members</span>
              <span className="detail-chip">{group.sessions?.length || 0} linked sessions</span>
            </div>

            <div className="detail-action-row">
              <button className="button button-primary" onClick={handleJoin}>Join this group</button>
              {group.courseCode ? <Link to="/courses" className="button button-secondary">Open courses</Link> : null}
            </div>
          </div>
        </section>

        <div className="detail-layout">
          <section className="detail-panel">
            <h2>How this group runs</h2>
            <div className="detail-copy-stack">
              <p><strong>Who can join:</strong> {group.whoCanJoin || 'Students enrolled in the related course or approved by a moderator.'}</p>
              <p><strong>Communication:</strong> {group.communicationChannel || 'Dashboard announcements and a shared study chat.'}</p>
              <p><strong>Schedule notes:</strong> {group.scheduleNotes || 'Specific meeting times and participation expectations are posted by the group owner.'}</p>
            </div>
          </section>

          <section className="detail-panel">
            <h2>New member checklist</h2>
            <ul className="detail-list">
              {(group.newMemberSteps && group.newMemberSteps.length > 0
                ? group.newMemberSteps
                : ['Introduce yourself to the group.', 'Review the shared study plan.', 'Join the next live session.'])
                .map((item: string) => <li key={item}>{item}</li>)}
            </ul>
          </section>
        </div>

        <div className="detail-layout">
          <section className="detail-panel">
            <h2>Requirements and rules</h2>
            <div className="detail-card-grid">
              <article className="detail-summary-card">
                <strong>Join requirements</strong>
                <ul className="detail-list compact-list">
                  {(group.joinRequirements && group.joinRequirements.length > 0 ? group.joinRequirements : ['Read the welcome notes and attend the intro session.'])
                    .map((item: string) => <li key={item}>{item}</li>)}
                </ul>
              </article>
              <article className="detail-summary-card">
                <strong>Group rules</strong>
                <ul className="detail-list compact-list">
                  {(group.groupRules && group.groupRules.length > 0 ? group.groupRules : ['Stay respectful and keep discussion academic.'])
                    .map((item: string) => <li key={item}>{item}</li>)}
                </ul>
              </article>
              <article className="detail-summary-card">
                <strong>Member benefits</strong>
                <ul className="detail-list compact-list">
                  {(group.memberBenefits && group.memberBenefits.length > 0 ? group.memberBenefits : ['Shared notes, peer support, and structured academic help.'])
                    .map((item: string) => <li key={item}>{item}</li>)}
                </ul>
              </article>
            </div>
          </section>

          <section className="detail-panel">
            <div className="section-header">
              <h2>Current members</h2>
              <span className="panel-pill">{group.membersList?.length || 0} saved</span>
            </div>
            {group.membersList && group.membersList.length > 0 ? (
              <div className="member-list">
                {group.membersList.map((member: any) => (
                  <article key={member.email} className="member-list-card">
                    <div>
                      <strong>{member.name}</strong>
                      <p>{member.email}</p>
                    </div>
                    <div className="member-list-meta">
                      <span>{new Date(member.enrolledAt).toLocaleString()}</span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p>No members yet. Be the first to join.</p>
            )}
          </section>
        </div>

        <section className="detail-panel">
          <div className="section-header">
            <h2>Related sessions</h2>
            <span className="panel-pill">{group.sessions?.length || 0} sessions</span>
          </div>
          <div className="detail-card-grid">
            {(group.sessions || []).length > 0 ? (
              group.sessions.map((session: any) => (
                <article key={session.id} className="detail-summary-card">
                  <strong>{session.title}</strong>
                  <p>{session.startsAt ? new Date(session.startsAt).toLocaleString() : session.time || 'Time to be confirmed'}</p>
                  <span>{session.enrolledCount || 0} enrolled</span>
                </article>
              ))
            ) : (
              <p>No related sessions found.</p>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}

export default GroupDetail;
