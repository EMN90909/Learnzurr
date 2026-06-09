<script lang="ts">
  import WorkflowPage from '$lib/components/WorkflowPage.svelte';
  const checkpoints = ["Fetches data through frontend/src/lib/api.ts and the Go REST API only.", "Uses Supabase PostgreSQL tables through backend repositories and migration-defined policies.", "Queues slow or sensitive side effects through Redis Streams for worker processing."];
</script>
<WorkflowPage title="My quizzes" summary="Take assigned quizzes, see status and earn age-adaptive gamification rewards." dataPath="/api/lms/my/quizzes" primaryAction="Open workflow" {checkpoints} />
