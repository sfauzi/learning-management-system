-- ============================================================================
--  Repair quiz grading
--
--  Quizzes created before the max-grade field existed were stored with
--  grade_max = 0 (an empty number input was coerced to 0), so every attempt
--  scored 0 and the mirrored gradebook row had max_grade 0. This migration
--  repairs the affected rows, recomputes the scores that can be derived, and
--  adds a constraint so a zero maximum can never be stored again.
-- ============================================================================

-- 1. invalid maximums ---------------------------------------------------------
update public.quizzes
   set grade_max = 100
 where grade_max is null or grade_max <= 0;

update public.assignments
   set grade_max = 100
 where grade_max is null or grade_max <= 0;

update public.grade_items
   set max_grade = 100
 where max_grade is null or max_grade <= 0;

-- 2. recompute attempts whose score was multiplied by a zero maximum ---------
with scored as (
  select
    a.id,
    sum(q.points) as total,
    sum(case when (a.answers -> 'review' -> (q.id::text) ->> 'right') = 'true'
             then q.points else 0 end) as earned,
    qz.grade_max
  from public.quiz_attempts a
  join public.quizzes qz on qz.id = a.quiz_id
  join public.quiz_questions q on q.quiz_id = a.quiz_id
  where a.state = 'finished'
    and a.needs_grading = false
    and a.answers ? 'review'
  group by a.id, qz.grade_max
)
update public.quiz_attempts a
   set score = round((s.earned / nullif(s.total, 0)) * s.grade_max, 2)
  from scored s
 where a.id = s.id
   and s.total > 0;

-- 3. re-mirror the best attempt into the gradebook ---------------------------
with best as (
  select
    gi.id as grade_item_id,
    a.user_id,
    max(a.score) as best_score
  from public.grade_items gi
  join public.quiz_attempts a
    on a.quiz_id = gi.item_id
   and a.state = 'finished'
   and a.score is not null
  where gi.item_type = 'quiz'
  group by gi.id, a.user_id
)
insert into public.grade_grades (grade_item_id, user_id, grade)
select grade_item_id, user_id, best_score from best
on conflict (grade_item_id, user_id)
do update set grade = excluded.grade;

-- 4. guardrails --------------------------------------------------------------
alter table public.quizzes
  drop constraint if exists quizzes_grade_max_positive;
alter table public.quizzes
  add constraint quizzes_grade_max_positive check (grade_max > 0);

alter table public.assignments
  drop constraint if exists assignments_grade_max_positive;
alter table public.assignments
  add constraint assignments_grade_max_positive check (grade_max > 0);

alter table public.grade_items
  drop constraint if exists grade_items_max_grade_positive;
alter table public.grade_items
  add constraint grade_items_max_grade_positive check (max_grade > 0);

alter table public.quiz_questions
  drop constraint if exists quiz_questions_points_positive;
alter table public.quiz_questions
  add constraint quiz_questions_points_positive check (points > 0);

-- every quiz that carries questions should have a gradebook column
insert into public.grade_items (course_id, item_type, item_id, name, max_grade, weight, sortorder)
select q.course_id, 'quiz', q.id, q.name, q.grade_max, 1, 98
  from public.quizzes q
 where not exists (
   select 1 from public.grade_items gi
    where gi.course_id = q.course_id
      and gi.item_type = 'quiz'
      and gi.item_id = q.id
 );

-- one gradebook column per activity instance (prevents duplicate rows when a
-- lecturer edits an activity twice in parallel)
create unique index if not exists grade_items_activity_uniq
  on public.grade_items (course_id, item_type, item_id)
  where item_id is not null;
