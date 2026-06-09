<script lang="ts">
  import WorkflowPage from '$lib/components/WorkflowPage.svelte';
  const checkpoints = ["Fetches data through frontend/src/lib/api.ts and the Go REST API only.", "Uses Supabase PostgreSQL tables through backend repositories and migration-defined policies.", "Queues slow or sensitive side effects through Redis Streams for worker processing."];
</script>
<WorkflowPage title="Class detail" summary="Manage learners, co-teachers, timetable, materials, moderation and class settings." dataPath="/api/teacher/classes" primaryAction="Open workflow" {checkpoints} />
