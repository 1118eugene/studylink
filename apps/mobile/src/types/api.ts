import type { UserRole } from '@studylink/shared';

export type User = {
  id: number;
  email: string;
  name: string;
  university?: string;
  program?: string;
  role?: UserRole;
  major?: string;
  yearOfStudy?: string;
  bio?: string;
  profileVisibility?: 'members' | 'private';
  notificationPreferences?: { groups: boolean; sessions: boolean; moderation: boolean };
};

export type Group = {
  id: number;
  name: string;
  description: string;
  course: string;
  courseCode: string;
  meetingType: string;
  members: number;
  capacity?: number | null;
  joinType?: 'open' | 'closed';
  isMember?: boolean;
  image: string;
  ownerUserId: number | null;
  sessionCount: number;
  joinRequirements?: string[];
  groupRules?: string[];
  memberBenefits?: string[];
  newMemberSteps?: string[];
  whoCanJoin?: string;
  communicationChannel?: string;
  scheduleNotes?: string;
  sessions?: Session[];
  membersList?: { name: string; email: string; enrolledAt: string }[];
};

export type Session = {
  id: number;
  title: string;
  startsAt: string | null;
  time: string;
  location: string;
  group: string;
  groupId: number;
  courseCode: string;
  status: string;
  date?: string;
  dayOfWeek?: string;
  month?: string;
  enrolledCount: number;
  isEnrolled?: boolean;
  createdByUserId?: number | null;
  groupOwnerUserId?: number | null;
  agenda: string[];
  prepNotes: string[];
  attendanceRules: string[];
};

export type Resource = {
  id: number;
  title: string;
  type: string;
  url: string;
  description: string;
  usageNotes: string;
  audience: string;
  sourceNote?: string;
  downloads: number;
  courseCode?: string;
};

export type Course = {
  id: number;
  code: string;
  category: string;
  title: string;
  description?: string;
  image_url?: string;
  level?: string;
  delivery_mode?: string;
  isEnrolled?: boolean;
};

export type AcademicSchool = { id: number; name: string; short_code?: string };
export type AcademicProgram = { id: number; school_id: number; name: string; code?: string };
export type AcademicCourse = {
  id: number;
  program_id?: number;
  semester_id?: number;
  code: string;
  title: string;
  description?: string;
  program_name?: string;
  program_code?: string;
  year_number?: number;
  semester_name?: string;
};
export type CourseResource = { id: number; title: string; url: string; resource_type?: string };

export type ProfileResponse = {
  user: User;
  summary: { courseCount: number; groupCount: number; sessionCount: number; resourceCount: number; classmateCount: number };
  courses: Course[];
  groups: Group[];
  sessions: Session[];
  resources: Resource[];
};

export type AppNotification = {
  id: number;
  type: 'groups' | 'sessions' | 'moderation';
  title: string;
  message: string;
  created_at: string;
  read_at: string | null;
};
