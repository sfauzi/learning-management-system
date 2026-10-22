-- ============================================================================
--  Row level security
--  The Next.js server talks to Postgres with the service role, so every query is
--  scoped in application code; these policies are the second line of defence for
--  any direct (anon / authenticated) client access to the REST API.
-- ============================================================================

create or replace function public.current_role_name()
returns text language sql stable security definer set search_path = public as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'anon');
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select public.current_role_name() in ('admin', 'manager');
$$;

create or replace function public.is_teacher_role()
returns boolean language sql stable security definer set search_path = public as $$
  select public.current_role_name() in ('teacher', 'admin', 'manager');
$$;

create or replace function public.is_enrolled(p_course bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.enrollments e
    where e.course_id = p_course and e.user_id = auth.uid()
  );
$$;

create or replace function public.can_manage_course(p_course bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_staff() or exists (
    select 1 from public.courses c
    where c.id = p_course and c.teacher_id = auth.uid()
  );
$$;

create or replace function public.course_of_forum(p_forum bigint)
returns bigint language sql stable security definer set search_path = public as $$
  select course_id from public.forums where id = p_forum;
$$;

alter table public.profiles                enable row level security;
alter table public.course_categories       enable row level security;
alter table public.courses                 enable row level security;
alter table public.enrollments             enable row level security;
alter table public.course_sections         enable row level security;
alter table public.course_modules          enable row level security;
alter table public.module_completions      enable row level security;
alter table public.announcements           enable row level security;
alter table public.forums                  enable row level security;
alter table public.forum_discussions       enable row level security;
alter table public.forum_posts             enable row level security;
alter table public.assignments             enable row level security;
alter table public.assignment_submissions  enable row level security;
alter table public.quizzes                 enable row level security;
alter table public.quiz_questions          enable row level security;
alter table public.quiz_options            enable row level security;
alter table public.quiz_attempts           enable row level security;
alter table public.resources               enable row level security;
alter table public.grade_items             enable row level security;
alter table public.grade_grades            enable row level security;
alter table public.calendar_events         enable row level security;
alter table public.conversations           enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages                enable row level security;
alter table public.app_notifications       enable row level security;
alter table public.settings                enable row level security;
alter table public.login_logs              enable row level security;

-- profiles ------------------------------------------------------------------
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles
  for select to authenticated using (true);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = public.current_role_name());

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- catalogue -----------------------------------------------------------------
drop policy if exists categories_read on public.course_categories;
create policy categories_read on public.course_categories
  for select to authenticated using (visible or public.is_staff());

drop policy if exists categories_write on public.course_categories;
create policy categories_write on public.course_categories
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists courses_read on public.courses;
create policy courses_read on public.courses
  for select to authenticated
  using (visible or public.is_staff() or teacher_id = auth.uid() or public.is_enrolled(id));

drop policy if exists courses_write on public.courses;
create policy courses_write on public.courses
  for all to authenticated
  using (public.is_staff() or teacher_id = auth.uid())
  with check (public.is_staff() or teacher_id = auth.uid());

drop policy if exists enrollments_read on public.enrollments;
create policy enrollments_read on public.enrollments
  for select to authenticated
  using (user_id = auth.uid() or public.can_manage_course(course_id));

drop policy if exists enrollments_self_enrol on public.enrollments;
create policy enrollments_self_enrol on public.enrollments
  for insert to authenticated
  with check (
    (user_id = auth.uid()
      and exists (select 1 from public.courses c where c.id = course_id and c.self_enrol))
    or public.can_manage_course(course_id)
  );

drop policy if exists enrollments_leave on public.enrollments;
create policy enrollments_leave on public.enrollments
  for delete to authenticated
  using (user_id = auth.uid() or public.can_manage_course(course_id));

drop policy if exists sections_read on public.course_sections;
create policy sections_read on public.course_sections
  for select to authenticated
  using (public.is_enrolled(course_id) or public.can_manage_course(course_id));

drop policy if exists sections_write on public.course_sections;
create policy sections_write on public.course_sections
  for all to authenticated
  using (public.can_manage_course(course_id))
  with check (public.can_manage_course(course_id));

drop policy if exists modules_read on public.course_modules;
create policy modules_read on public.course_modules
  for select to authenticated
  using (public.is_enrolled(course_id) or public.can_manage_course(course_id));

drop policy if exists modules_write on public.course_modules;
create policy modules_write on public.course_modules
  for all to authenticated
  using (public.can_manage_course(course_id))
  with check (public.can_manage_course(course_id));

drop policy if exists completions_own on public.module_completions;
create policy completions_own on public.module_completions
  for all to authenticated
  using (user_id = auth.uid() or public.can_manage_course(course_id))
  with check (user_id = auth.uid() or public.can_manage_course(course_id));

-- announcements -------------------------------------------------------------
drop policy if exists announcements_read on public.announcements;
create policy announcements_read on public.announcements
  for select to authenticated
  using (
    (published and course_id is null)
    or (course_id is not null and (public.is_enrolled(course_id) or public.can_manage_course(course_id)))
    or public.is_staff()
  );

drop policy if exists announcements_write on public.announcements;
create policy announcements_write on public.announcements
  for all to authenticated
  using ((course_id is null and public.is_staff()) or public.can_manage_course(course_id))
  with check ((course_id is null and public.is_staff()) or public.can_manage_course(course_id));

-- forums --------------------------------------------------------------------
drop policy if exists forums_read on public.forums;
create policy forums_read on public.forums
  for select to authenticated
  using (course_id is null or public.is_enrolled(course_id) or public.can_manage_course(course_id));

drop policy if exists forums_write on public.forums;
create policy forums_write on public.forums
  for all to authenticated
  using (course_id is not null and public.can_manage_course(course_id))
  with check (course_id is not null and public.can_manage_course(course_id));

drop policy if exists discussions_read on public.forum_discussions;
create policy discussions_read on public.forum_discussions
  for select to authenticated
  using (public.is_enrolled(public.course_of_forum(forum_id)) or public.can_manage_course(public.course_of_forum(forum_id)));

drop policy if exists discussions_insert on public.forum_discussions;
create policy discussions_insert on public.forum_discussions
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and (public.is_enrolled(public.course_of_forum(forum_id)) or public.can_manage_course(public.course_of_forum(forum_id)))
  );

drop policy if exists discussions_update on public.forum_discussions;
create policy discussions_update on public.forum_discussions
  for update to authenticated
  using (user_id = auth.uid() or public.can_manage_course(public.course_of_forum(forum_id)))
  with check (user_id = auth.uid() or public.can_manage_course(public.course_of_forum(forum_id)));

drop policy if exists posts_read on public.forum_posts;
create policy posts_read on public.forum_posts
  for select to authenticated using (true);

drop policy if exists posts_insert on public.forum_posts;
create policy posts_insert on public.forum_posts
  for insert to authenticated with check (user_id = auth.uid());

-- assignments ---------------------------------------------------------------
drop policy if exists assignments_read on public.assignments;
create policy assignments_read on public.assignments
  for select to authenticated
  using (public.is_enrolled(course_id) or public.can_manage_course(course_id));

drop policy if exists assignments_write on public.assignments;
create policy assignments_write on public.assignments
  for all to authenticated
  using (public.can_manage_course(course_id))
  with check (public.can_manage_course(course_id));

drop policy if exists submissions_read on public.assignment_submissions;
create policy submissions_read on public.assignment_submissions
  for select to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.assignments a
               where a.id = assignment_id and public.can_manage_course(a.course_id))
  );

drop policy if exists submissions_own on public.assignment_submissions;
create policy submissions_own on public.assignment_submissions
  for all to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.assignments a
               where a.id = assignment_id and public.can_manage_course(a.course_id))
  )
  with check (
    user_id = auth.uid()
    or exists (select 1 from public.assignments a
               where a.id = assignment_id and public.can_manage_course(a.course_id))
  );

-- quizzes -------------------------------------------------------------------
drop policy if exists quizzes_read on public.quizzes;
create policy quizzes_read on public.quizzes
  for select to authenticated
  using (public.is_enrolled(course_id) or public.can_manage_course(course_id));

drop policy if exists quizzes_write on public.quizzes;
create policy quizzes_write on public.quizzes
  for all to authenticated
  using (public.can_manage_course(course_id))
  with check (public.can_manage_course(course_id));

drop policy if exists questions_read on public.quiz_questions;
create policy questions_read on public.quiz_questions
  for select to authenticated
  using (exists (select 1 from public.quizzes q
                 where q.id = quiz_id
                   and (public.is_enrolled(q.course_id) or public.can_manage_course(q.course_id))));

drop policy if exists questions_write on public.quiz_questions;
create policy questions_write on public.quiz_questions
  for all to authenticated
  using (exists (select 1 from public.quizzes q
                 where q.id = quiz_id and public.can_manage_course(q.course_id)))
  with check (exists (select 1 from public.quizzes q
                      where q.id = quiz_id and public.can_manage_course(q.course_id)));

-- quiz_options is deliberately locked down: it carries the answer key, so only
-- the service role (server side) may touch it.
revoke all on public.quiz_options from anon, authenticated;

drop policy if exists attempts_read on public.quiz_attempts;
create policy attempts_read on public.quiz_attempts
  for select to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.quizzes q
               where q.id = quiz_id and public.can_manage_course(q.course_id))
  );

drop policy if exists attempts_own on public.quiz_attempts;
create policy attempts_own on public.quiz_attempts
  for all to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.quizzes q
               where q.id = quiz_id and public.can_manage_course(q.course_id))
  )
  with check (
    user_id = auth.uid()
    or exists (select 1 from public.quizzes q
               where q.id = quiz_id and public.can_manage_course(q.course_id))
  );

-- resources -----------------------------------------------------------------
drop policy if exists resources_read on public.resources;
create policy resources_read on public.resources
  for select to authenticated
  using (public.is_enrolled(course_id) or public.can_manage_course(course_id));

drop policy if exists resources_write on public.resources;
create policy resources_write on public.resources
  for all to authenticated
  using (public.can_manage_course(course_id))
  with check (public.can_manage_course(course_id));

-- gradebook -----------------------------------------------------------------
drop policy if exists grade_items_read on public.grade_items;
create policy grade_items_read on public.grade_items
  for select to authenticated
  using (public.is_enrolled(course_id) or public.can_manage_course(course_id));

drop policy if exists grade_items_write on public.grade_items;
create policy grade_items_write on public.grade_items
  for all to authenticated
  using (public.can_manage_course(course_id))
  with check (public.can_manage_course(course_id));

drop policy if exists grade_grades_read on public.grade_grades;
create policy grade_grades_read on public.grade_grades
  for select to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.grade_items gi
               where gi.id = grade_item_id and public.can_manage_course(gi.course_id))
  );

drop policy if exists grade_grades_write on public.grade_grades;
create policy grade_grades_write on public.grade_grades
  for all to authenticated
  using (exists (select 1 from public.grade_items gi
                 where gi.id = grade_item_id and public.can_manage_course(gi.course_id)))
  with check (exists (select 1 from public.grade_items gi
                      where gi.id = grade_item_id and public.can_manage_course(gi.course_id)));

-- calendar ------------------------------------------------------------------
drop policy if exists calendar_read on public.calendar_events;
create policy calendar_read on public.calendar_events
  for select to authenticated
  using (
    user_id = auth.uid()
    or (course_id is not null and (public.is_enrolled(course_id) or public.can_manage_course(course_id)))
  );

drop policy if exists calendar_own on public.calendar_events;
create policy calendar_own on public.calendar_events
  for all to authenticated
  using (user_id = auth.uid() or (course_id is not null and public.can_manage_course(course_id)))
  with check (user_id = auth.uid() or (course_id is not null and public.can_manage_course(course_id)));

-- messaging -----------------------------------------------------------------
drop policy if exists conversations_read on public.conversations;
create policy conversations_read on public.conversations
  for select to authenticated
  using (exists (select 1 from public.conversation_participants p
                 where p.conversation_id = id and p.user_id = auth.uid()));

drop policy if exists participants_own on public.conversation_participants;
create policy participants_own on public.conversation_participants
  for all to authenticated
  using (user_id = auth.uid() or public.is_staff())
  with check (user_id = auth.uid() or public.is_staff());

drop policy if exists messages_read on public.messages;
create policy messages_read on public.messages
  for select to authenticated
  using (exists (select 1 from public.conversation_participants p
                 where p.conversation_id = messages.conversation_id and p.user_id = auth.uid()));

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.conversation_participants p
                where p.conversation_id = messages.conversation_id and p.user_id = auth.uid())
  );

-- notifications -------------------------------------------------------------
drop policy if exists notifications_own on public.app_notifications;
create policy notifications_own on public.app_notifications
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- settings ------------------------------------------------------------------
drop policy if exists settings_read on public.settings;
create policy settings_read on public.settings
  for select to authenticated using (true);

drop policy if exists settings_write on public.settings;
create policy settings_write on public.settings
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- login logs ----------------------------------------------------------------
drop policy if exists login_logs_staff on public.login_logs;
create policy login_logs_staff on public.login_logs
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- storage buckets
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('materials', 'materials', false),
  ('submissions', 'submissions', false)
on conflict (id) do nothing;
