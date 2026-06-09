<script lang="ts">
  import WorkflowPage from '$lib/components/WorkflowPage.svelte';
  const checkpoints = ["Fetches data through frontend/src/lib/api.ts and the Go REST API only.", "Uses Supabase PostgreSQL tables through backend repositories and migration-defined policies.", "Queues slow or sensitive side effects through Redis Streams for worker processing."];
</script>
<WorkflowPage title="Live classroom host" summary="Open the WebRTC room, manage camera slots, board state, chat safety and attendance." dataPath="/api/classroom/rooms" primaryAction="Open workflow" {checkpoints} />
