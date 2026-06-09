<script lang="ts">
  import WorkflowPage from '$lib/components/WorkflowPage.svelte';
  const checkpoints = ["Fetches data through frontend/src/lib/api.ts and the Go REST API only.", "Uses Supabase PostgreSQL tables through backend repositories and migration-defined policies.", "Queues slow or sensitive side effects through Redis Streams for worker processing."];
</script>
<WorkflowPage title="Quiz builder" summary="Create quizzes, attach questions, set time limits and publish to enrolled learners." dataPath="/api/lms/quizzes" primaryAction="Open workflow" {checkpoints} />
