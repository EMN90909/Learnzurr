<script lang="ts">
  import WorkflowPage from '$lib/components/WorkflowPage.svelte';
  const checkpoints = ["Fetches data through frontend/src/lib/api.ts and the Go REST API only.", "Uses Supabase PostgreSQL tables through backend repositories and migration-defined policies.", "Queues slow or sensitive side effects through Redis Streams for worker processing."];
</script>
<WorkflowPage title="Mearn overview" summary="Track gross volume, split results, treasury pots, pending payouts and fraud flags." dataPath="/api/mearn/overview" primaryAction="Open workflow" {checkpoints} />
