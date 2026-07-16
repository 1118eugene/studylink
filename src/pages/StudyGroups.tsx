import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../assets/images/api';

interface StudyGroup {
  id: number;
  name: string;
  course: string;
  courseCode: string;
  meetingType: 'In-Person' | 'Online' | 'Hybrid';
  members: number;
  image: string;
  description?: string;
  joinRequirements?: string[];
  groupRules?: string[];
  memberBenefits?: string[];
  newMemberSteps?: string[];
  whoCanJoin?: string;
  communicationChannel?: string;
  scheduleNotes?: string;
  sessionCount?: number;
}

function StudyGroups() {
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('All courses');
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    courseName: '',
    courseCode: '',
    meetingType: 'Hybrid',
    imageUrl: '',
    whoCanJoin: '',
    joinRequirements: '',
    groupRules: '',
    memberBenefits: '',
    newMemberSteps: '',
    communicationChannel: '',
    scheduleNotes: '',
  });

  const loadGroups = async () => {
    try {
      const response = await apiFetch('/api/groups');
      const data = await response.json();
      setGroups(data.groups || []);
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const filterOptions = useMemo(
    () => ['All courses', ...Array.from(new Set(groups.map((group) => group.courseCode).filter(Boolean)))],
    [groups],
  );

  const filteredGroups = selectedFilter === 'All courses'
    ? groups
    : groups.filter((group) => group.courseCode === selectedFilter);

  const resetGroupForm = () => {
    setEditingGroupId(null);
    setGroupForm({
      name: '',
      description: '',
      courseName: '',
      courseCode: '',
      meetingType: 'Hybrid',
      imageUrl: '',
      whoCanJoin: '',
      joinRequirements: '',
      groupRules: '',
      memberBenefits: '',
      newMemberSteps: '',
      communicationChannel: '',
      scheduleNotes: '',
    });
  };

  const loadGroupIntoForm = (group: StudyGroup) => {
    setEditingGroupId(group.id);
    setGroupForm({
      name: group.name || '',
      description: group.description || '',
      courseName: group.course || '',
      courseCode: group.courseCode || '',
      meetingType: group.meetingType || 'Hybrid',
      imageUrl: group.image || '',
      whoCanJoin: group.whoCanJoin || '',
      joinRequirements: (group.joinRequirements || []).join('\n'),
      groupRules: (group.groupRules || []).join('\n'),
      memberBenefits: (group.memberBenefits || []).join('\n'),
      newMemberSteps: (group.newMemberSteps || []).join('\n'),
      communicationChannel: group.communicationChannel || '',
      scheduleNotes: group.scheduleNotes || '',
    });
  };

  const saveGroup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      name: groupForm.name,
      description: groupForm.description,
      courseName: groupForm.courseName,
      courseCode: groupForm.courseCode,
      meetingType: groupForm.meetingType,
      imageUrl: groupForm.imageUrl,
      whoCanJoin: groupForm.whoCanJoin,
      joinRequirements: groupForm.joinRequirements.split('\n').map((value) => value.trim()).filter(Boolean),
      groupRules: groupForm.groupRules.split('\n').map((value) => value.trim()).filter(Boolean),
      memberBenefits: groupForm.memberBenefits.split('\n').map((value) => value.trim()).filter(Boolean),
      newMemberSteps: groupForm.newMemberSteps.split('\n').map((value) => value.trim()).filter(Boolean),
      communicationChannel: groupForm.communicationChannel,
      scheduleNotes: groupForm.scheduleNotes,
    };

    try {
      const response = await apiFetch(editingGroupId ? `/api/groups/${editingGroupId}` : '/api/groups', {
        method: editingGroupId ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Unable to save group');
      }

      await loadGroups();
      resetGroupForm();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      alert('Could not save the group. Please try again.');
    }
  };

  const deleteGroup = async (groupId: number) => {
    if (!window.confirm('Delete this study group?')) {
      return;
    }

    try {
      const response = await apiFetch(`/api/groups/${groupId}`, { method: 'DELETE' });
      if (!response.ok && response.status !== 204) {
        throw new Error('Unable to delete group');
      }

      await loadGroups();
      if (editingGroupId === groupId) {
        resetGroupForm();
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      alert('Could not delete the group.');
    }
  };

  const handleJoinGroup = async (groupId: number) => {
    try {
      const response = await apiFetch(`/api/groups/${groupId}/enroll`, { method: 'POST' });
      if (!response.ok) {
        throw new Error('Join failed');
      }

      await loadGroups();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      alert('Failed to join the group. Please sign in again and try once more.');
    }
  };

  return (
    <section className="groups-page workspace-page">
      <div className="container workspace-stack">
        <section className="workspace-hero workspace-hero-groups">
          <div>
            <p className="workspace-eyebrow">Study Groups</p>
            <h1>Build structured learning circles with saved members, rules, and session plans.</h1>
            <p className="workspace-lead">
              Group memberships now stay in the database, so the member counts and detailed rosters you see here
              remain available whenever students return.
            </p>
          </div>
          <div className="hero-stat-grid">
            <article className="hero-stat-card">
              <span className="hero-stat-value">{groups.length}</span>
              <span className="hero-stat-label">Active groups</span>
            </article>
            <article className="hero-stat-card">
              <span className="hero-stat-value">{groups.reduce((sum, group) => sum + group.members, 0)}</span>
              <span className="hero-stat-label">Saved memberships</span>
            </article>
          </div>
        </section>

        <div className="groups-header">
          <div className="page-header">
            <h2>Create or manage groups</h2>
            <p className="page-description">Keep your study structure professional with requirements, rules, and scheduling notes.</p>
          </div>
          <button className="button button-primary" onClick={resetGroupForm}>New group</button>
        </div>

        <div className="management-panel">
          <div className="section-header">
            <h2>{editingGroupId ? 'Edit Group' : 'Create Group'}</h2>
            {editingGroupId ? <button className="text-button" onClick={resetGroupForm}>Cancel editing</button> : null}
          </div>

          <form className="management-form" onSubmit={saveGroup}>
            <div className="form-grid form-grid-two">
              <label>
                <span>Group name</span>
                <input value={groupForm.name} onChange={(event) => setGroupForm((current) => ({ ...current, name: event.target.value }))} required />
              </label>
              <label>
                <span>Course code</span>
                <input value={groupForm.courseCode} onChange={(event) => setGroupForm((current) => ({ ...current, courseCode: event.target.value }))} />
              </label>
            </div>

            <label>
              <span>Description</span>
              <textarea value={groupForm.description} onChange={(event) => setGroupForm((current) => ({ ...current, description: event.target.value }))} rows={3} />
            </label>

            <div className="form-grid form-grid-two">
              <label>
                <span>Course name</span>
                <input value={groupForm.courseName} onChange={(event) => setGroupForm((current) => ({ ...current, courseName: event.target.value }))} />
              </label>
              <label>
                <span>Meeting type</span>
                <select value={groupForm.meetingType} onChange={(event) => setGroupForm((current) => ({ ...current, meetingType: event.target.value }))}>
                  <option>Hybrid</option>
                  <option>In-Person</option>
                  <option>Online</option>
                </select>
              </label>
            </div>

            <div className="form-grid form-grid-two">
              <label>
                <span>Image URL</span>
                <input value={groupForm.imageUrl} onChange={(event) => setGroupForm((current) => ({ ...current, imageUrl: event.target.value }))} />
              </label>
              <label>
                <span>Who can join</span>
                <input value={groupForm.whoCanJoin} onChange={(event) => setGroupForm((current) => ({ ...current, whoCanJoin: event.target.value }))} />
              </label>
            </div>

            <div className="form-grid form-grid-two">
              <label>
                <span>Join requirements</span>
                <textarea value={groupForm.joinRequirements} onChange={(event) => setGroupForm((current) => ({ ...current, joinRequirements: event.target.value }))} rows={3} placeholder="One requirement per line" />
              </label>
              <label>
                <span>Group rules</span>
                <textarea value={groupForm.groupRules} onChange={(event) => setGroupForm((current) => ({ ...current, groupRules: event.target.value }))} rows={3} placeholder="One rule per line" />
              </label>
            </div>

            <div className="form-grid form-grid-two">
              <label>
                <span>Member benefits</span>
                <textarea value={groupForm.memberBenefits} onChange={(event) => setGroupForm((current) => ({ ...current, memberBenefits: event.target.value }))} rows={3} placeholder="One benefit per line" />
              </label>
              <label>
                <span>New member steps</span>
                <textarea value={groupForm.newMemberSteps} onChange={(event) => setGroupForm((current) => ({ ...current, newMemberSteps: event.target.value }))} rows={3} placeholder="One step per line" />
              </label>
            </div>

            <div className="form-grid form-grid-two">
              <label>
                <span>Communication channel</span>
                <input value={groupForm.communicationChannel} onChange={(event) => setGroupForm((current) => ({ ...current, communicationChannel: event.target.value }))} />
              </label>
              <label>
                <span>Schedule notes</span>
                <input value={groupForm.scheduleNotes} onChange={(event) => setGroupForm((current) => ({ ...current, scheduleNotes: event.target.value }))} />
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="button button-primary">{editingGroupId ? 'Update group' : 'Create group'}</button>
              {editingGroupId ? <button type="button" className="button button-secondary" onClick={resetGroupForm}>Reset</button> : null}
            </div>
          </form>
        </div>

        <section className="workspace-toolbar">
          <div>
            <h2>Member-ready group spaces</h2>
            <p>Open any group to inspect full rosters, requirements, and linked sessions.</p>
          </div>
          <select value={selectedFilter} onChange={(event) => setSelectedFilter(event.target.value)} className="filter-select">
            {filterOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </section>

        {loading ? (
          <div className="workspace-loading-card">
            <p>Loading study groups...</p>
          </div>
        ) : (
          <div className="groups-grid elevated-groups-grid">
            {filteredGroups.map((group) => (
              <article key={group.id} className="group-card polished-group-card">
                <img className="group-image" src={group.image} alt={group.name} loading="lazy" />
                <div className="group-header-content">
                  <div className="group-title">
                    <h3>{group.name}</h3>
                    <p className="group-course">{group.courseCode} · {group.course}</p>
                  </div>
                  <span className={`meeting-badge ${group.meetingType.toLowerCase()}`}>
                    {group.meetingType}
                  </span>
                </div>
                <p className="group-description">{group.description}</p>
                <div className="group-meta-snippet">
                  <p><strong>Join:</strong> {group.whoCanJoin || 'Students connected to the course or approved by the moderator.'}</p>
                  <p><strong>Sessions:</strong> {group.sessionCount || 0} planned</p>
                  <p><strong>Members:</strong> {group.members}</p>
                </div>
                <div className="group-footer">
                  <div className="group-actions">
                    <Link to={`/groups/${group.id}`} className="action-link">View details</Link>
                    <button type="button" className="action-link" onClick={() => loadGroupIntoForm(group)}>Edit</button>
                    <button type="button" className="action-link action-danger" onClick={() => deleteGroup(group.id)}>Delete</button>
                  </div>
                  <button onClick={() => handleJoinGroup(group.id)} className="button button-primary button-sm">
                    Join group
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default StudyGroups;
