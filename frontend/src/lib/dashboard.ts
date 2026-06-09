export type DashboardMetric = { label: string; value: string; trend: string; tone: 'gold'|'green'|'blue'|'rose' };
export type ActionItem = { title: string; body: string; href: string; priority: 'low'|'medium'|'high' };
export function parentMetrics(children: number): DashboardMetric[] { return [
 { label: 'Children enrolled', value: String(children), trend: '+1 this holiday', tone: 'gold' },
 { label: 'Average progress', value: '78%', trend: '+12% this month', tone: 'green' },
 { label: 'Upcoming classes', value: '6', trend: 'next starts 4pm', tone: 'blue' },
 { label: 'Pending payments', value: 'KES 1,400', trend: '2 invoices', tone: 'rose' }
]; }
export function teacherMetrics(): DashboardMetric[] { return [
 { label: 'Active learners', value: '142', trend: '+18 this week', tone: 'gold' },
 { label: 'Earnings', value: 'KES 42,000', trend: 'August holiday', tone: 'green' },
 { label: 'Live classes', value: '8', trend: '3 today', tone: 'blue' },
 { label: 'Assignments to grade', value: '27', trend: 'due tonight', tone: 'rose' }
]; }
export function learnerMetrics(age = 12): DashboardMetric[] { const junior = age <= 12; return [
 { label: junior ? 'Stars earned' : 'Points earned', value: junior ? '1,250' : '8,400', trend: '+120 today', tone: 'gold' },
 { label: 'Learning streak', value: '14 days', trend: 'keep going', tone: 'green' },
 { label: 'Badges', value: '9', trend: '2 new', tone: 'blue' },
 { label: 'Tasks due', value: '3', trend: 'before Friday', tone: 'rose' }
]; }
export function adminMetrics(): DashboardMetric[] { return [
 { label: 'Platform revenue', value: 'KES 1.2M', trend: '+23%', tone: 'gold' },
 { label: 'Moderation queue', value: '19', trend: '6 urgent', tone: 'rose' },
 { label: 'Verified teachers', value: '380', trend: '+14 today', tone: 'green' },
 { label: 'System health', value: '99.9%', trend: 'all engines up', tone: 'blue' }
]; }
export const urgentActions: ActionItem[] = [
 { title: 'Verify teacher certificate', body: 'A teacher cannot publish classes until their uploaded document is reviewed.', href: '/admin/users/teachers', priority: 'high' },
 { title: 'Approve marketplace listing', body: 'Lanmat listing has passed automated checks and needs admin approval.', href: '/admin/lanmat/pending', priority: 'medium' },
 { title: 'Review payout request', body: 'Mearn detected a payout request above the automatic threshold.', href: '/admin/mearn/payouts', priority: 'high' }
];
