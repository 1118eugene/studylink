export type User = {
  id: number;
  email: string;
  name: string;
  university?: string;
  role?: string;
  major?: string;
  yearOfStudy?: string;
  bio?: string;
};

export type Group = {
  id: number;
  name: string;
  description: string;
  course: string;
  courseCode: string;
  meetingType: string;
  members: number;
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
