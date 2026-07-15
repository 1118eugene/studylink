import { useEffect, useState } from 'react';
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
  const [selectedFilter, setSelectedFilter] = useState('All courses');
  const [joinedGroups, setJoinedGroups] = useState<number[]>([]);
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
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

  const defaultGroups: StudyGroup[] = [
    {
      id: 1,
      name: 'Software Engineering Squad',
      course: 'Software Engineering',
      courseCode: 'CS401',
      meetingType: 'In-Person',
      members: 2,
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80',
      description: 'Weekly coding sessions and sprint prep for software design projects.',
    },
    {
      id: 2,
      name: 'APT3065 Project Team',
      course: 'Mid-Term Project',
      courseCode: 'APT3065',
      meetingType: 'Online',
      members: 3,
      image: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80',
      description: 'Remote collaboration for planning, prototyping, and presenting the semester project.',
    },
    {
      id: 3,
      name: 'CS101 Beginners Group',
      course: 'Introduction to Computer Science',
      courseCode: 'CS101',
      meetingType: 'Hybrid',
      members: 2,
      image: 'https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=900&q=80',
      description: 'Supportive study circle for beginners learning programming fundamentals.',
    },
    {
      id: 4,
      name: 'Data Structures Study Circle',
      course: 'Data Structures & Algorithms',
      courseCode: 'CS201',
      meetingType: 'In-Person',
      members: 3,
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80',
      description: 'Focused revision and practice on arrays, trees, and problem solving.',
    },
    {
      id: 5,
      name: 'Business Strategy Circle',
      course: 'Introduction to Business',
      courseCode: 'BUS101',
      meetingType: 'Hybrid',
      members: 4,
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80',
      description: 'Discuss case studies, assignments, and startup concepts with peers.',
    },
    {
      id: 6,
      name: 'Calculus Problem Solvers',
      course: 'Calculus I',
      courseCode: 'MATH101',
      meetingType: 'Online',
      members: 5,
      image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80',
      description: 'Practice problem sets and share concepts for exam preparation.',
    },
  ];

  const [groups, setGroups] = useState<StudyGroup[]>(defaultGroups);

  useEffect(() => {
    apiFetch('/api/groups')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.groups) {
          const server: any[] = data.groups;
          const merged = defaultGroups.map((d) => {
            const s = server.find((g) => g.id === d.id);
            if (!s) return d;
            return {
              ...d,
              name: s.name || d.name,
              description: s.description || d.description,
              course: s.course || d.course,
              courseCode: s.courseCode || d.courseCode,
              meetingType: s.meetingType || d.meetingType,
              members: (s.enrollments && s.enrollments.length) || d.members,
              image: s.image || d.image,
              joinRequirements: s.joinRequirements || [],
              groupRules: s.groupRules || [],
              memberBenefits: s.memberBenefits || [],
              newMemberSteps: s.newMemberSteps || [],
              whoCanJoin: s.whoCanJoin || '',
              communicationChannel: s.communicationChannel || '',
              scheduleNotes: s.scheduleNotes || '',
              sessionCount: s.sessionCount || 0,
            } as StudyGroup;
          });
          const serverOnly = server
            .filter((g) => !defaultGroups.some((d) => d.id === g.id))
            .map((g) => ({
              id: g.id,
              name: g.name,
              course: g.course || g.description || '',
              courseCode: g.courseCode || '',
              meetingType: (g.meetingType || 'Hybrid') as 'In-Person' | 'Online' | 'Hybrid',
              members: (g.enrollments && g.enrollments.length) || 0,
              image: g.image || '',
              description: g.description || '',
              joinRequirements: g.joinRequirements || [],
              groupRules: g.groupRules || [],
              memberBenefits: g.memberBenefits || [],
              newMemberSteps: g.newMemberSteps || [],
              whoCanJoin: g.whoCanJoin || '',
              communicationChannel: g.communicationChannel || '',
              scheduleNotes: g.scheduleNotes || '',
              sessionCount: g.sessionCount || 0,
            } as StudyGroup));

          setGroups([...merged, ...serverOnly]);
        }
      })
      .catch(() => {
        // keep default groups if fetch fails
      });
  }, []);

  const filteredGroups = selectedFilter === 'All courses' ? groups : groups.filter((group) => group.courseCode === selectedFilter);

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

      const data = await response.json();
      const savedGroup = data.group;

      setGroups((current) => {
        if (editingGroupId) {
          return current.map((group) => (group.id === savedGroup.id ? { ...group, ...savedGroup } : group));
        }
        return [savedGroup, ...current];
      });
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

      setGroups((current) => current.filter((group) => group.id !== groupId));
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
    const raw = localStorage.getItem('user');
    if (!raw || !localStorage.getItem('token')) {
      window.location.href = '/login';
      return;
    }

    try {
      const res = await apiFetch(`/api/groups/${groupId}/enroll`, { method: 'POST' });
      if (!res.ok) {
        throw new Error('Join failed');
      }

      const data = await res.json();
      setJoinedGroups((current) => (current.includes(groupId) ? current : [...current, groupId]));
      if (data?.group) {
        setGroups((current) => current.map((group) => (group.id === groupId ? { ...group, ...data.group } : group)));
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      alert('Failed to join the group. Please sign in again and try once more.');
    }
  };

  return (
    <section className="groups-page">
      <div className="container">
        <div className="groups-header">
          <div className="page-header">
            <h1>Study Groups</h1>
            <p className="page-description">Find a group for your course or start your own.</p>
          </div>
          <button className="button button-primary" onClick={() => resetGroupForm()}>+ New group</button>
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
                <input value={groupForm.name} onChange={(e) => setGroupForm((current) => ({ ...current, name: e.target.value }))} required />
              </label>
              <label>
                <span>Course code</span>
                <input value={groupForm.courseCode} onChange={(e) => setGroupForm((current) => ({ ...current, courseCode: e.target.value }))} />
              </label>
            </div>

            <label>
              <span>Description</span>
              <textarea value={groupForm.description} onChange={(e) => setGroupForm((current) => ({ ...current, description: e.target.value }))} rows={3} />
            </label>

            <div className="form-grid form-grid-two">
              <label>
                <span>Course name</span>
                <input value={groupForm.courseName} onChange={(e) => setGroupForm((current) => ({ ...current, courseName: e.target.value }))} />
              </label>
              <label>
                <span>Meeting type</span>
                <select value={groupForm.meetingType} onChange={(e) => setGroupForm((current) => ({ ...current, meetingType: e.target.value }))}>
                  <option>Hybrid</option>
                  <option>In-Person</option>
                  <option>Online</option>
                </select>
              </label>
            </div>

            <div className="form-grid form-grid-two">
              <label>
                <span>Image URL</span>
                <input value={groupForm.imageUrl} onChange={(e) => setGroupForm((current) => ({ ...current, imageUrl: e.target.value }))} />
              </label>
              <label>
                <span>Who can join</span>
                <input value={groupForm.whoCanJoin} onChange={(e) => setGroupForm((current) => ({ ...current, whoCanJoin: e.target.value }))} />
              </label>
            </div>

            <div className="form-grid form-grid-two">
              <label>
                <span>Join requirements</span>
                <textarea value={groupForm.joinRequirements} onChange={(e) => setGroupForm((current) => ({ ...current, joinRequirements: e.target.value }))} rows={3} placeholder="One requirement per line" />
              </label>
              <label>
                <span>Group rules</span>
                <textarea value={groupForm.groupRules} onChange={(e) => setGroupForm((current) => ({ ...current, groupRules: e.target.value }))} rows={3} placeholder="One rule per line" />
              </label>
            </div>

            <div className="form-grid form-grid-two">
              <label>
                <span>Member benefits</span>
                <textarea value={groupForm.memberBenefits} onChange={(e) => setGroupForm((current) => ({ ...current, memberBenefits: e.target.value }))} rows={3} placeholder="One benefit per line" />
              </label>
              <label>
                <span>New member steps</span>
                <textarea value={groupForm.newMemberSteps} onChange={(e) => setGroupForm((current) => ({ ...current, newMemberSteps: e.target.value }))} rows={3} placeholder="One step per line" />
              </label>
            </div>

            <div className="form-grid form-grid-two">
              <label>
                <span>Communication channel</span>
                <input value={groupForm.communicationChannel} onChange={(e) => setGroupForm((current) => ({ ...current, communicationChannel: e.target.value }))} />
              </label>
              <label>
                <span>Schedule notes</span>
                <input value={groupForm.scheduleNotes} onChange={(e) => setGroupForm((current) => ({ ...current, scheduleNotes: e.target.value }))} />
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="button button-primary">{editingGroupId ? 'Update group' : 'Create group'}</button>
              {editingGroupId ? <button type="button" className="button button-secondary" onClick={resetGroupForm}>Reset</button> : null}
            </div>
          </form>
        </div>

        <select
          value={selectedFilter}
          onChange={(e) => setSelectedFilter(e.target.value)}
          className="filter-select"
        >
          <option>All courses</option>
          <option>CS101</option>
          <option>CS201</option>
          <option>CS301</option>
          <option>CS401</option>
          <option>APT3065</option>
          <option>BUS101</option>
          <option>MATH101</option>
        </select>

        <div className="groups-grid">
          {filteredGroups.map((group) => (
            <div key={group.id} className="group-card">
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
                <p><strong>New member requirements:</strong> {(group.joinRequirements && group.joinRequirements[0]) || 'Read the welcome notes and attend the intro session.'}</p>
                <p><strong>Rules:</strong> {(group.groupRules && group.groupRules[0]) || 'Stay respectful and keep discussion academic.'}</p>
                <p><strong>Benefits:</strong> {(group.memberBenefits && group.memberBenefits[0]) || 'Shared study support and peer learning.'}</p>
              </div>
                <div className="group-footer">
                <p className="group-members">{group.members} members</p>
                <div className="group-actions">
                  <Link to={`/groups/${group.id}`} className="action-link">View</Link>
                    <button type="button" className="action-link" onClick={() => loadGroupIntoForm(group)}>Edit</button>
                    <button type="button" className="action-link action-danger" onClick={() => deleteGroup(group.id)}>Delete</button>
                  <button
                    onClick={() => handleJoinGroup(group.id)}
                    className={`button button-sm ${
                      joinedGroups.includes(group.id) ? 'joined' : 'button-primary'
                    }`}
                  >
                    {joinedGroups.includes(group.id) ? 'Joined' : 'Join'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default StudyGroups;
