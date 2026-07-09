import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface StudyGroup {
  id: number;
  name: string;
  course: string;
  courseCode: string;
  meetingType: 'In-Person' | 'Online' | 'Hybrid';
  members: number;
  image: string;
  description?: string;
}

function StudyGroups() {
  const [selectedFilter, setSelectedFilter] = useState('All courses');
  const [joinedGroups, setJoinedGroups] = useState<number[]>([]);

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
    fetch('/api/groups')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.groups) {
          // merge server groups with defaults: keep images/descriptions from defaults when missing on server
          const server: any[] = data.groups;
          const merged = defaultGroups.map((d) => {
            const s = server.find((g) => g.id === d.id);
            if (!s) return d;
            return {
              ...d,
              name: s.name || d.name,
              description: s.description || d.description,
              members: (s.enrollments && s.enrollments.length) || d.members,
            } as StudyGroup;
          });
          // also append any server-only groups
          const serverOnly = server
            .filter((g) => !defaultGroups.some((d) => d.id === g.id))
            .map((g) => ({
              id: g.id,
              name: g.name,
              course: g.description || '',
              courseCode: '',
              meetingType: 'Hybrid' as const,
              members: (g.enrollments && g.enrollments.length) || 0,
              image: '',
              description: g.description || '',
            } as StudyGroup));

          setGroups([...merged, ...serverOnly]);
        }
      })
      .catch(() => {
        // keep default groups if fetch fails
      });
  }, []);

  const filteredGroups = selectedFilter === 'All courses' ? groups : groups.filter((group) => group.courseCode === selectedFilter);

  const handleJoinGroup = (groupId: number) => {
    if (joinedGroups.includes(groupId)) {
      setJoinedGroups(joinedGroups.filter((g) => g !== groupId));
    } else {
      setJoinedGroups([...joinedGroups, groupId]);
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
          <button className="button button-primary">+ New group</button>
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
                <div className="group-footer">
                <p className="group-members">{group.members} members</p>
                <div className="group-actions">
                  <Link to={`/groups/${group.id}`} className="action-link">View</Link>
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
