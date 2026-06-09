export type Role = 'parent' | 'teacher' | 'learner' | 'admin';
export type ApiResult<T> = { data: T; error?: string };
export type PublicStats = { activeClasses: number; verifiedTeachers: number; learnersEnrolled: number };
export type Subject = { id: string; name: string; slug: string };
export type FeaturedClass = { id: string; subject: string; title: string; teacherName: string; priceKes: number; ageGroup: string; enrollCount: number; thumbnail: string };
export type UserSession = { token: string; role: Role; name: string } | null;
export type DashboardMetric = { label: string; value: string; tone?: string };
