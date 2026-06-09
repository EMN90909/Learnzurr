<script lang="ts">
import DashboardShell from '$lib/components/DashboardShell.svelte';
import MetricCard from '$lib/components/MetricCard.svelte';
import ActionPanel from '$lib/components/ActionPanel.svelte';
import { teacherMetrics, urgentActions } from '$lib/dashboard';
const links = [{"href": "/teacher/dashboard", "label": "Dashboard"}, {"href": "/teacher/profile", "label": "Profile"}, {"href": "/teacher/classes", "label": "Classes"}, {"href": "/teacher/lms", "label": "LMS"}, {"href": "/teacher/timetable", "label": "Timetable"}, {"href": "/teacher/classroom", "label": "Classroom"}, {"href": "/teacher/meetings", "label": "Meetings"}, {"href": "/teacher/earnings", "label": "Earnings"}, {"href": "/teacher/payouts", "label": "Payouts"}, {"href": "/teacher/lanmat", "label": "Lanmat"}, {"href": "/teacher/messages", "label": "Messages"}, {"href": "/teacher/notifications", "label": "Notifications"}, {"href": "/teacher/settings", "label": "Settings"}];
const metrics = teacherMetrics();
</script>
<DashboardShell role="Teacher dashboard" title="Teacher command centre" {links}>
  <section class="grid">{#each metrics as metric}<MetricCard {...metric} />{/each}</section>
  <section class="panel"><div><h2>Today’s focus</h2><p>Everything on this page connects through the Go API, Redis queues, PostgreSQL tables, and engine services described in the backend.</p></div><div class="actions">{#each urgentActions as action}<ActionPanel {...action} />{/each}</div></section>
</DashboardShell>
<style>.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1rem}.panel{margin-top:1.5rem;padding:1.3rem;border-radius:28px;background:rgba(255,255,255,.72);box-shadow:0 24px 80px rgba(35,24,11,.08);display:grid;grid-template-columns:1fr 1.4fr;gap:1rem}h2{font-size:2rem;margin:.2rem 0}p{color:#655849}.actions{display:grid;gap:.8rem}@media(max-width:900px){.grid,.panel{grid-template-columns:1fr}}</style>
