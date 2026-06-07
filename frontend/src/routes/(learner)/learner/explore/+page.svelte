
<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { subscribeToTable, unsubscribe } from '$lib/realtime';
  let realtimeStatus = 'Connecting to public project updates';
  let projectChannel: ReturnType<typeof subscribeToTable> = null;
  onMount(() => { projectChannel = subscribeToTable('studio_projects', () => { realtimeStatus = 'Project list updated from Supabase realtime'; }); });
  onDestroy(() => unsubscribe(projectChannel));
  import StudioLauncher from '$lib/components/StudioLauncher.svelte';
  import ProjectExplorer from '$lib/components/ProjectExplorer.svelte';
</script>
<svelte:head><title>Explore Learner Projects | Learnzur</title><meta name="description" content="Browse public learner projects, like, comment, report, and discover safe creative work on Learnzur." /></svelte:head>
<section class="page explore-page"><p class="eyebrow">Explore</p><h1>Discover public projects from other learners</h1><p class="lead">Explore shows only approved public code projects, animations, movies, and games. Likes, comments, and reports go through Find, San, Media, Flag, and Gamfy.</p><ProjectExplorer /><StudioLauncher /><p class="muted">{realtimeStatus}</p>
</section>
