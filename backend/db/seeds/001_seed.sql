INSERT INTO users (id, email, full_name, password_hash, university, role)
VALUES
  (1, 'demo@studylink.local', 'StudyLink Demo User', NULL, 'University Demo', 'student')
ON CONFLICT (id) DO NOTHING;

INSERT INTO study_groups (id, name, description, course_name, course_code, meeting_type, owner_user_id)
VALUES
  (1, 'CS101 Beginners Group', 'Weekly study group for introductory CS', 'Introduction to Computer Science', 'CS101', 'Hybrid', 1),
  (2, 'Data Structures Study Circle', 'Deep dives into DS topics', 'Data Structures & Algorithms', 'CS201', 'In-Person', 1),
  (3, 'APT3065 Project Team', 'Remote collaboration for planning, prototyping, and presenting the semester project.', 'Mid-Term Project', 'APT3065', 'Online', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO sessions (id, group_id, title, starts_at, location, status, created_by_user_id)
VALUES
  (1, 1, 'Intro to Recursion', '2026-06-18 09:00:00+00', 'Science Block LT2', 'Upcoming', 1),
  (2, 2, 'Binary Trees & Heaps Deep Dive', '2026-06-19 15:30:00+00', 'Library Room 3A', 'Upcoming', 1),
  (3, 3, 'APT3065 Sprint Review', '2026-06-20 14:00:00+00', 'Lab A', 'Upcoming', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO resources (id, title, resource_type, url, description, created_by_user_id)
VALUES
  (1, 'Recursion Notes', 'pdf', '/assets/recursion.pdf', 'Study notes for recursion concepts', 1),
  (2, 'Binary Trees Slides', 'ppt', '/assets/trees.pptx', 'Slides for tree traversal and heaps', 1)
ON CONFLICT (id) DO NOTHING;