/**
 * Seeds the LMS demo dataset: 17 accounts, 6 courses with sections,
 * activities, quizzes with questions, gradebook entries and announcements.
 *
 *   pnpm db:seed            # idempotent — skips content if courses exist
 *   pnpm db:seed --fresh    # wipes courses/announcements and reseeds
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const FRESH = process.argv.includes("--fresh");
const PASSWORD = "password";

const DAY = 86_400_000;
const now = Date.now();
const iso = (offsetDays: number, hours = 9) => {
  const d = new Date(now + offsetDays * DAY);
  d.setHours(hours, 0, 0, 0);
  return d.toISOString();
};

function fail(step: string, error: unknown): never {
  console.error(`✖ ${step}`, error);
  process.exit(1);
}

async function findAuthUserByEmail(email: string) {
  let page = 1;
  while (page < 20) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) fail("listUsers", error);
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit;
    if (data.users.length < 200) return null;
    page += 1;
  }
  return null;
}

async function ensureUser(profile: {
  email: string;
  full_name: string;
  username: string;
  role: string;
  idnumber?: string;
  study_program?: string;
}) {
  const existing = await findAuthUserByEmail(profile.email);
  let id = existing?.id;

  if (!id) {
    const { data, error } = await db.auth.admin.createUser({
      email: profile.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: profile.full_name,
        username: profile.username,
        role: profile.role,
      },
    });
    if (error) fail(`createUser ${profile.email}`, error);
    id = data.user!.id;
  }

  const { error: profileError } = await db
    .from("profiles")
    .update({
      full_name: profile.full_name,
      username: profile.username,
      role: profile.role,
      email: profile.email,
      idnumber: profile.idnumber ?? null,
      institution: "Telkom University",
      study_program: profile.study_program ?? null,
    })
    .eq("id", id);

  if (profileError) fail(`profile ${profile.email}`, profileError);
  return id!;
}

async function main() {
  console.log("→ settings");
  const settings: Record<string, string> = {
    site_name: "LMS",
    site_tagline: "Learning Management System",
    site_short_name: "LMS Telkom University",
    brand_color: "#a12520",
    support_email: "clove@telkomuniversity.ac.id",
    support_wa_lecturer: "082116663563",
    support_wa_student: "081222001813",
    footer_address:
      "Gedung Panehan Lantai 1,\nJl. Telekomunikasi Terusan Buah Batu,\nBandung - 40257, Indonesia",
    sso_enabled: "1",
    registration_enabled: "0",
    academic_year: "2026/2027",
    semester: "5",
  };
  await db
    .from("settings")
    .upsert(
      Object.entries(settings).map(([k, v]) => ({ key: k, value: v })),
      { onConflict: "key" }
    );

  if (FRESH) {
    console.log("→ clearing previous content");
    await db.from("announcements").delete().neq("id", 0);
    await db.from("calendar_events").delete().neq("id", 0);
    await db.from("app_notifications").delete().neq("id", 0);
    await db.from("courses").delete().neq("id", 0);
    await db.from("course_categories").delete().neq("id", 0);
  }

  console.log("→ accounts");
  const admin = await ensureUser({
    email: "admin@telkomuniversity.ac.id",
    full_name: "Administrator LMS",
    username: "admin",
    role: "admin",
    idnumber: "198001012005011001",
    study_program: "CeLOE",
  });

  const lecturerSeed = [
    ["1987654321", "Dr. Ade Kurniawan, S.T., M.T.", "ade.kurniawan", "Informatics"],
    ["1978112233", "Najla Nur Adila, S.Kom., M.Kom.", "najla.adila", "Information Systems"],
    ["1985010199", "Rizky Pratama, S.T., M.Sc.", "rizky.pratama", "Electrical Engineering"],
    ["1990020244", "Siti Rahmawati, S.Pd., M.Pd.", "siti.rahmawati", "Digital Business"],
  ] as const;

  const lecturers: string[] = [];
  for (const [nidn, name, uname, prodi] of lecturerSeed) {
    lecturers.push(
      await ensureUser({
        email: `${uname}@telkomuniversity.ac.id`,
        full_name: name,
        username: uname,
        role: "teacher",
        idnumber: nidn,
        study_program: prodi,
      })
    );
  }

  const studentNames = [
    "Andi Saputra", "Bunga Lestari", "Citra Dewi", "Dimas Nugroho",
    "Eka Putri", "Fajar Ramadhan", "Gita Permata", "Hendra Wijaya",
    "Indah Kartika", "Joko Susilo", "Kartika Sari", "Lukman Hakim",
  ];

  const students: string[] = [];
  for (const [i, name] of studentNames.entries()) {
    const uname = name.toLowerCase().replace(/ /g, ".");
    students.push(
      await ensureUser({
        email: `${uname}@student.telkomuniversity.ac.id`,
        full_name: name,
        username: uname,
        role: "student",
        idnumber: `13012${String(100 + i).padStart(5, "0")}`,
        study_program: "Informatics",
      })
    );
  }

  const { count: courseCount } = await db
    .from("courses")
    .select("id", { count: "exact", head: true });
  if ((courseCount ?? 0) > 0) {
    console.log(`✔ ${courseCount} courses already present — content seed skipped`);
    console.log(`  accounts: 1 admin, ${lecturers.length} lecturers, ${students.length} students`);
    return;
  }

  console.log("→ categories");
  const faculty = [
    ["Fakultas Informatika", "FIF"],
    ["Fakultas Teknik Elektro", "FTE"],
    ["Fakultas Ekonomi dan Bisnis", "FEB"],
    ["Fakultas Industri Kreatif", "FIK"],
  ];
  const { data: cats, error: catError } = await db
    .from("course_categories")
    .insert(
      faculty.map(([name, idn], i) => ({
        name,
        idnumber: idn,
        description: `Program studi di lingkungan ${name}.`,
        sortorder: i + 1,
        visible: true,
      }))
    )
    .select("id");
  if (catError) fail("categories", catError);
  const catIds = cats!.map((c) => c.id);

  console.log("→ courses");
  const courseSeed = [
    ["Pemrograman Web Lanjut", "PW-LANJUT", 0, 0, "#a12520", "Pengembangan aplikasi web modern menggunakan framework MVC, REST API, otentikasi, dan deployment."],
    ["Basis Data Terdistribusi", "BD-TERDIST", 0, 1, "#0051f9", "Konsep replikasi, partisi, konsistensi, dan transaksi terdistribusi pada sistem basis data modern."],
    ["Jaringan Komputer", "JARKOM", 1, 2, "#28a745", "Arsitektur jaringan, protokol TCP/IP, routing, switching, dan keamanan jaringan."],
    ["Kecerdasan Buatan", "AI", 0, 0, "#6610f2", "Algoritma pencarian, representasi pengetahuan, machine learning dasar, dan penerapan AI."],
    ["Manajemen Proyek TI", "MPTI", 2, 3, "#ff7518", "Perencanaan, penjadwalan, pengendalian, dan manajemen risiko proyek teknologi informasi."],
    ["Desain Pengalaman Pengguna", "UXD", 3, 1, "#e83e8c", "Metodologi riset pengguna, wireframing, prototyping, dan evaluasi usability."],
  ] as const;

  const sectionTitles = [
    "Pendahuluan & Kontrak Kuliah",
    "Materi Pertemuan 1-4",
    "Materi Pertemuan 5-8",
    "Evaluasi Akhir",
  ];

  for (const [index, seed] of courseSeed.entries()) {
    const [fullname, shortname, catIndex, teacherIndex, color, summary] = seed;
    const teacherId = lecturers[teacherIndex];

    const { data: course, error } = await db
      .from("courses")
      .insert({
        category_id: catIds[catIndex],
        fullname,
        shortname,
        idnumber: `MK-${String(index + 1).padStart(3, "0")}`,
        summary,
        format: "topics",
        numsections: 4,
        color,
        visible: true,
        self_enrol: index < 3,
        enrol_key: index < 3 ? `${shortname.slice(0, 4).toUpperCase()}2026` : null,
        credits: [3, 3, 2, 3, 2, 3][index],
        semester: 5,
        academic_year: "2026/2027",
        start_date: "2026-09-01",
        end_date: "2027-01-15",
        teacher_id: teacherId,
      })
      .select("id")
      .single();
    if (error) fail(`course ${shortname}`, error);
    const courseId = course!.id;

    const { data: sections } = await db
      .from("course_sections")
      .insert(
        sectionTitles.map((name, i) => ({ course_id: courseId, section: i, name, visible: true }))
      )
      .select("id");
    const sectionIds = (sections ?? []).map((s) => s.id);

    await db.from("enrollments").insert({
      course_id: courseId,
      user_id: teacherId,
      role: "teacher",
      status: "active",
      timestart: new Date().toISOString(),
    });

    for (const [si, studentId] of students.entries()) {
      if ((si + index) % 3 === 2) continue;
      await db.from("enrollments").insert({
        course_id: courseId,
        user_id: studentId,
        role: "student",
        status: "active",
        timestart: new Date().toISOString(),
      });
    }

    // ------------------------------------------------------------- forums
    const { data: annForum } = await db
      .from("forums")
      .insert({ course_id: courseId, name: "Announcements", intro: "Pengumuman resmi dari dosen pengampu.", type: "announcements" })
      .select("id")
      .single();
    await db.from("course_modules").insert({
      course_id: courseId,
      section_id: sectionIds[0],
      type: "forum",
      instance_id: annForum!.id,
      name: "Announcements",
      sortorder: 1,
      visible: true,
    });

    const { data: discussion } = await db
      .from("forum_discussions")
      .insert({
        forum_id: annForum!.id,
        user_id: teacherId,
        name: `Selamat datang di ${fullname}`,
        message: `Selamat datang di mata kuliah ${fullname}.\n\nSilakan pelajari kontrak kuliah. Kehadiran minimal 75% untuk dapat mengikuti ujian akhir.`,
        pinned: true,
        last_post_at: iso(-3),
        post_count: 1,
      })
      .select("id")
      .single();
    await db.from("forum_posts").insert({
      discussion_id: discussion!.id,
      user_id: teacherId,
      message: "Silakan bertanya di forum Q&A bila ada kendala.",
    });

    const { data: qaForum } = await db
      .from("forums")
      .insert({ course_id: courseId, name: "Q&A Forum", intro: "Tempat diskusi dan tanya jawab antar mahasiswa.", type: "qanda" })
      .select("id")
      .single();
    await db.from("course_modules").insert({
      course_id: courseId,
      section_id: sectionIds[1],
      type: "forum",
      instance_id: qaForum!.id,
      name: "Q&A Forum",
      sortorder: 2,
      visible: true,
    });

    // ---------------------------------------------------------- resources
    const resourceSeed = [
      [`RPS ${shortname}`, "page", "Silabus dan rencana pembelajaran semester.", null],
      ["Slide Pertemuan 1", "url", "Materi pengantar perkuliahan.", "https://telkomuniversity.ac.id"],
      ["Modul Praktikum", "page", "Panduan praktikum lengkap.", null],
    ] as const;

    for (const [ri, [rname, kind, intro, rurl]] of resourceSeed.entries()) {
      const { data: res } = await db
        .from("resources")
        .insert({
          course_id: courseId,
          name: rname,
          kind,
          intro,
          url: rurl,
          content:
            kind === "page"
              ? `<h2>${rname}</h2><p>${intro} Dokumen ini berisi capaian pembelajaran, pokok bahasan per pertemuan, dan rubrik penilaian.</p><ul><li>Capaian pembelajaran umum</li><li>Rencana pembelajaran per pertemuan</li><li>Referensi utama dan pendukung</li></ul>`
              : null,
        })
        .select("id")
        .single();
      await db.from("course_modules").insert({
        course_id: courseId,
        section_id: sectionIds[1],
        type: "resource",
        instance_id: res!.id,
        name: rname,
        sortorder: 3 + ri,
        visible: true,
      });
    }

    // -------------------------------------------------------- assignment
    const { data: assignment } = await db
      .from("assignments")
      .insert({
        course_id: courseId,
        name: `Tugas Besar ${shortname}`,
        description:
          "Kerjakan tugas besar sesuai ketentuan pada dokumen panduan. Kumpulkan dalam format PDF.",
        duedate: iso(7 + index),
        cutoffdate: iso(14 + index),
        grade_max: 100,
        submission_type: "both",
        allow_late: true,
      })
      .select("id")
      .single();
    await db.from("course_modules").insert({
      course_id: courseId,
      section_id: sectionIds[2],
      type: "assign",
      instance_id: assignment!.id,
      name: `Tugas Besar ${shortname}`,
      sortorder: 10,
      visible: true,
    });

    // -------------------------------------------------------------- quiz
    const { data: quiz } = await db
      .from("quizzes")
      .insert({
        course_id: courseId,
        name: `Kuis 1 ${shortname}`,
        intro: "Kuis pilihan ganda, 3 soal, waktu 15 menit.",
        open_at: iso(-2),
        close_at: iso(10),
        time_limit: 15,
        max_attempts: 3,
        grade_max: 100,
        shuffle: false,
        show_result: true,
      })
      .select("id")
      .single();
    await db.from("course_modules").insert({
      course_id: courseId,
      section_id: sectionIds[2],
      type: "quiz",
      instance_id: quiz!.id,
      name: `Kuis 1 ${shortname}`,
      sortorder: 11,
      visible: true,
    });

    const questions = [
      ["Apa kepanjangan dari MVC?", ["Model View Controller", "Multiple Virtual Cache", "Managed View Component", "Main Variable Container"], "MVC memisahkan model, view, dan controller."],
      ["Manakah yang termasuk DBMS relasional?", ["MySQL", "MongoDB", "Redis", "Cassandra"], "MySQL menyimpan data dalam tabel relasional."],
      ['HTTP status untuk "Not Found" adalah?', ["404", "200", "500", "302"], "404 berarti resource tidak ditemukan."],
    ] as const;

    for (const [qi, [question, options, explanation]] of questions.entries()) {
      const { data: q } = await db
        .from("quiz_questions")
        .insert({
          quiz_id: quiz!.id,
          question,
          explanation,
          type: "multichoice",
          points: 1,
          sortorder: qi,
        })
        .select("id")
        .single();
      await db.from("quiz_options").insert(
        options.map((label, oi) => ({
          question_id: q!.id,
          label,
          is_correct: oi === 0,
          sortorder: oi,
        }))
      );
    }

    // ---------------------------------------------------------- gradebook
    const { data: items } = await db
      .from("grade_items")
      .insert([
        { course_id: courseId, item_type: "assign", item_id: assignment!.id, name: "Tugas Besar", max_grade: 100, weight: 40, sortorder: 1 },
        { course_id: courseId, item_type: "quiz", item_id: quiz!.id, name: "Kuis 1", max_grade: 100, weight: 20, sortorder: 2 },
        { course_id: courseId, item_type: "manual", item_id: null, name: "Ujian Akhir Semester", max_grade: 100, weight: 40, sortorder: 3 },
      ])
      .select("id");

    const { data: enrolledStudents } = await db
      .from("enrollments")
      .select("user_id")
      .eq("course_id", courseId)
      .eq("role", "student");

    const gradeRows: {
      grade_item_id: number;
      user_id: string;
      grade: number;
      graded_by: string;
    }[] = [];
    for (const student of enrolledStudents ?? []) {
      for (const item of items ?? []) {
        gradeRows.push({
          grade_item_id: item.id,
          user_id: student.user_id,
          grade: 65 + Math.floor(Math.random() * 34),
          graded_by: teacherId,
        });
      }
    }
    if (gradeRows.length) await db.from("grade_grades").insert(gradeRows);

    // ----------------------------------------------------------- calendar
    await db.from("calendar_events").insert([
      {
        course_id: courseId,
        name: `Deadline Tugas Besar ${shortname}`,
        start_at: iso(7 + index),
        end_at: iso(7 + index),
        type: "assignment",
        color: "#dc3545",
        description: "Batas akhir pengumpulan tugas.",
      },
      {
        course_id: courseId,
        name: `Kuliah ${fullname}`,
        start_at: iso(2, 8),
        end_at: iso(2, 10),
        type: "course",
        color,
        description: "Ruang kuliah daring.",
      },
    ]);
  }

  console.log("→ announcements");
  const siteAnnouncements = [
    {
      subject: "Handbook LMS untuk Mahasiswa",
      message:
        "Handbook LMS merupakan panduan bagi mahasiswa untuk mengakses dan menggunakan LMS, mulai dari login, self-enroll mata kuliah, aktivasi MFA, hingga memahami fitur dan aktivitas pembelajaran di LMS.",
      author: 0,
      pinned: true,
      daysAgo: 0,
    },
    {
      subject: "Buku Manual (Handbook) Pengisian Konten",
      message:
        "Telah tersedia HANDBOOK sebagai panduan bagi pengguna dalam memahami dan menggunakan berbagai fitur yang tersedia.\n\nPanduan ini mencakup akses CDS dan mata kuliah, pengisian konten, serta pengelolaan penilaian.",
      author: 2,
      pinned: false,
      daysAgo: 2,
    },
    {
      subject: "Maintenance LMS - 25 September 2026",
      message:
        "Salam HEI,\nDear Telutizen,\n\nAkan dilakukan maintenance dalam rangka optimalisasi infrastruktur sistem dan aplikasi perkuliahan daring.",
      author: 1,
      pinned: true,
      daysAgo: 4,
    },
  ];

  for (const a of siteAnnouncements) {
    const { data } = await db
      .from("announcements")
      .insert({
        subject: a.subject,
        message: a.message,
        user_id: lecturers[a.author],
        course_id: null,
        pinned: a.pinned,
        published: true,
      })
      .select("id")
      .single();
    if (data) {
      await db
        .from("announcements")
        .update({ created_at: new Date(now - a.daysAgo * DAY).toISOString() })
        .eq("id", data.id);
    }
  }

  await db.from("app_notifications").insert([
    {
      user_id: admin,
      title: "Selamat datang di LMS",
      body: "Data demo berhasil dimuat. Buka Site administration untuk melihat ringkasan.",
      url: "/admin",
    },
    {
      user_id: students[0],
      title: "Tugas baru tersedia",
      body: "Tugas Besar PW-LANJUT menunggu pengumpulan.",
      url: "/my",
    },
  ]);

  console.log("✔ seed complete");
  console.log(`  accounts: 1 admin, ${lecturers.length} lecturers, ${students.length} students`);
  console.log("  demo password: password");
}

main().catch((err) => fail("seed", err));
