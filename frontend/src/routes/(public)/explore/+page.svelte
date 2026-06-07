
<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { subscribeToTable, unsubscribe } from '$lib/realtime';
  let realtimeStatus = 'Connecting to public project updates';
  let projectChannel: ReturnType<typeof subscribeToTable> = null;
  onMount(() => { projectChannel = subscribeToTable('studio_projects', () => { realtimeStatus = 'Project list updated from Supabase realtime'; }); });
  onDestroy(() => unsubscribe(projectChannel));
  import ProjectExplorer from '$lib/components/ProjectExplorer.svelte';
</script>
<svelte:head><title>Explore Learnzur Classes and Projects</title><meta name="description" content="SEO-friendly public Explore for approved Learnzur classes and safe public learning projects." /></svelte:head>
<section class="page"><p class="eyebrow">Public Explore</p><h1>Browse public classes and safe learner work</h1><p class="lead">Public Explore is SEO-friendly and never exposes private learner, parent, or teacher data.</p><ProjectExplorer publicMode={true} /><p class="muted">{realtimeStatus}</p>
</section>
