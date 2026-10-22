export type Role = "student" | "teacher" | "admin" | "manager";

export type Profile = {
  id: string;
  username: string | null;
  full_name: string;
  email: string;
  role: Role;
  idnumber: string | null;
  phone: string | null;
  institution: string | null;
  study_program: string | null;
  avatar_path: string | null;
  lang: string;
  suspended: boolean;
  mfa_enabled: boolean;
  last_login_at: string | null;
  last_login_ip: string | null;
  created_at: string;
};

export type Category = {
  id: number;
  parent_id: number | null;
  name: string;
  idnumber: string | null;
  description: string | null;
  sortorder: number;
  visible: boolean;
};

export type Course = {
  id: number;
  category_id: number | null;
  fullname: string;
  shortname: string;
  idnumber: string | null;
  summary: string | null;
  format: string;
  numsections: number;
  image_path: string | null;
  color: string;
  visible: boolean;
  self_enrol: boolean;
  enrol_key: string | null;
  credits: number;
  semester: number;
  academic_year: string | null;
  start_date: string | null;
  end_date: string | null;
  teacher_id: string | null;
  created_at: string;
  teacher?: Pick<Profile, "id" | "full_name" | "email"> | null;
  category?: Pick<Category, "id" | "name"> | null;
};

export type Enrollment = {
  id: number;
  course_id: number;
  user_id: string;
  role: string;
  status: string;
  timestart: string | null;
  profile?: Profile;
};

export type Section = {
  id: number;
  course_id: number;
  section: number;
  name: string | null;
  summary: string | null;
  visible: boolean;
};

export type ModuleType = "assign" | "quiz" | "forum" | "resource";

export type CourseModule = {
  id: number;
  course_id: number;
  section_id: number;
  type: ModuleType;
  instance_id: number | null;
  name: string;
  intro: string | null;
  visible: boolean;
  sortorder: number;
};

export type Assignment = {
  id: number;
  course_id: number;
  name: string;
  description: string | null;
  duedate: string | null;
  cutoffdate: string | null;
  grade_max: number;
  submission_type: "file" | "online" | "both";
  allow_late: boolean;
};

export type Submission = {
  id: number;
  assignment_id: number;
  user_id: string;
  online_text: string | null;
  file_path: string | null;
  file_name: string | null;
  submitted_at: string | null;
  grade: number | null;
  feedback: string | null;
  graded_by: string | null;
  graded_at: string | null;
  status: string;
  profile?: Pick<Profile, "full_name" | "username">;
};

export type Quiz = {
  id: number;
  course_id: number;
  name: string;
  intro: string | null;
  open_at: string | null;
  close_at: string | null;
  time_limit: number | null;
  max_attempts: number;
  grade_max: number;
  shuffle: boolean;
  show_result: boolean;
};

export type QuestionType = "multichoice" | "truefalse" | "shortanswer" | "essay";

export type Question = {
  id: number;
  quiz_id: number;
  question: string;
  explanation: string | null;
  type: QuestionType;
  points: number;
  sortorder: number;
  options?: Option[];
};

export type Option = {
  id: number;
  question_id: number;
  label: string;
  is_correct: boolean;
  sortorder: number;
};

export type Attempt = {
  id: number;
  quiz_id: number;
  user_id: string;
  attempt_no: number;
  started_at: string | null;
  finished_at: string | null;
  score: number | null;
  answers: {
    raw?: Record<string, string>;
    review?: Record<
      string,
      { given: string | null; correct: number | null; right: boolean | null; type: string }
    >;
  } | null;
  state: "inprogress" | "finished";
  needs_grading: boolean;
  grading_note: string | null;
};

export type Forum = {
  id: number;
  course_id: number | null;
  name: string;
  intro: string | null;
  type: string;
  locked: boolean;
};

export type Discussion = {
  id: number;
  forum_id: number;
  user_id: string;
  name: string;
  message: string;
  pinned: boolean;
  locked: boolean;
  last_post_at: string | null;
  post_count: number;
  created_at: string;
  profile?: Pick<Profile, "full_name" | "username" | "role" | "avatar_path">;
};

export type ForumPost = {
  id: number;
  discussion_id: number;
  user_id: string;
  parent_id: number | null;
  message: string;
  created_at: string;
  profile?: Pick<Profile, "full_name" | "username" | "role" | "avatar_path">;
};

export type Resource = {
  id: number;
  course_id: number;
  name: string;
  intro: string | null;
  kind: "file" | "url" | "page";
  file_path: string | null;
  file_name: string | null;
  url: string | null;
  content: string | null;
};

export type GradeItem = {
  id: number;
  course_id: number;
  item_type: "manual" | "assign" | "quiz";
  item_id: number | null;
  name: string;
  max_grade: number;
  weight: number;
  sortorder: number;
};

export type GradeRow = {
  id: number;
  grade_item_id: number;
  user_id: string;
  grade: number | null;
  feedback: string | null;
  graded_by: string | null;
};

export type CalendarEvent = {
  id: number;
  course_id: number | null;
  user_id: string | null;
  name: string;
  description: string | null;
  start_at: string;
  end_at: string | null;
  type: string;
  color: string;
  course?: Pick<Course, "id" | "fullname" | "shortname"> | null;
};

export type Announcement = {
  id: number;
  subject: string;
  message: string;
  user_id: string | null;
  course_id: number | null;
  pinned: boolean;
  published: boolean;
  created_at: string;
  author?: Pick<Profile, "full_name" | "username"> | null;
  course?: Pick<Course, "id" | "fullname" | "shortname"> | null;
};

export type Conversation = {
  id: number;
  subject: string | null;
  created_at: string;
  updated_at: string;
  participants?: { user_id: string; profile?: Pick<Profile, "full_name" | "username"> }[];
  last_message?: { body: string; created_at: string; user_id: string } | null;
};

export type Message = {
  id: number;
  conversation_id: number;
  user_id: string;
  body: string;
  created_at: string;
  profile?: Pick<Profile, "full_name" | "username" | "avatar_path">;
};

export type Notification = {
  id: number;
  user_id: string;
  title: string;
  body: string | null;
  url: string | null;
  icon: string;
  read_at: string | null;
  created_at: string;
};

export type LoginLog = {
  id: number;
  user_id: string | null;
  username: string | null;
  ip: string | null;
  user_agent: string | null;
  success: boolean;
  created_at: string;
  profile?: Pick<Profile, "full_name"> | null;
};

export type SiteSettings = Record<string, string>;
