type SupabaseRow = Record<string, unknown>;

const DEFAULT_SUBJECTS = [
  'Mathematics',
  'English',
  'Science',
  'Kiswahili',
  'Physics',
  'Chemistry',
  'Biology',
  'History',
  'Geography',
  'Coding',
  'Art',
  'Music'
];

function supabaseConfig() {
  const url = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY || '';
  return { url: url.replace(/\/$/, ''), key };
}

async function supabaseFetch(path: string): Promise<Response | null> {
  const { url, key } = supabaseConfig();
  if (!url || !key) return null;
  return fetch(`${url}/rest/v1/${path}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: 'application/json'
    }
  });
}

async function countRows(table: string, filters = '') {
  const separator = filters ? '&' : '?';
  const response = await supabaseFetch(`${table}${filters}${separator}select=id`);
  if (!response?.ok) return 0;
  const rows = (await response.json()) as SupabaseRow[];
  return Array.isArray(rows) ? rows.length : 0;
}

export async function getPublicStats() {
  const [activeClasses, verifiedTeachers, learnersEnrolled] = await Promise.all([
    countRows('classes', '?status=eq.approved'),
    countRows('teacher_profiles', '?approval_status=eq.approved'),
    countRows('enrollments', '?status=eq.paid')
  ]);

  return {
    activeClasses,
    verifiedTeachers,
    learnersEnrolled,
    updatedAt: new Date().toISOString()
  };
}

export async function getPublicSubjects() {
  const response = await supabaseFetch('classes?select=subject&status=eq.approved&limit=100');
  if (!response?.ok) return DEFAULT_SUBJECTS;
  const rows = (await response.json()) as Array<{ subject?: string }>;
  const live = [...new Set(rows.map((row) => row.subject).filter(Boolean) as string[])];
  return live.length ? live : DEFAULT_SUBJECTS;
}

export async function getFeaturedClasses() {
  const response = await supabaseFetch('classes?select=id,title,subject,description,min_age,max_age,price_cents,teacher_id,metadata,created_at&status=eq.approved&order=created_at.desc&limit=3');
  if (!response?.ok) return [];
  const rows = (await response.json()) as SupabaseRow[];
  return rows.map((row) => {
    const metadata = typeof row.metadata === 'object' && row.metadata ? row.metadata as SupabaseRow : {};
    const priceCents = Number(row.price_cents || 0);
    return {
      id: String(row.id || ''),
      title: String(row.title || 'Holiday class'),
      subject: String(row.subject || 'Class'),
      teacherName: String(metadata.teacher_name || 'Verified Learnzur teacher'),
      teacherAvatar: String(metadata.teacher_avatar || ''),
      thumbnail: String(metadata.thumbnail_url || ''),
      price: priceCents > 0 ? `KSh ${Math.round(priceCents / 100).toLocaleString('en-KE')}` : 'Free',
      ageGroup: `${row.min_age || 8}-${row.max_age || 18}`,
      enrollCount: Number(metadata.enroll_count || 0),
      href: `/explore/class/${row.id}`
    };
  });
}
