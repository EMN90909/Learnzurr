<script lang="ts">
  import WorkflowPage from '$lib/components/WorkflowPage.svelte';
  const checkpoints = ["Fetches data through frontend/src/lib/api.ts and the Go REST API only.", "Uses Supabase PostgreSQL tables through backend repositories and migration-defined policies.", "Queues slow or sensitive side effects through Redis Streams for worker processing."];
</script>
<WorkflowPage title="Join live class" summary="Enter a safe learner classroom with board, chat, attendance and moderated participation." dataPath="/api/classroom/join" primaryAction="Open workflow" {checkpoints} />
