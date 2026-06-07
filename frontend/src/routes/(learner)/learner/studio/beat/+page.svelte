<script lang="ts">
  import CreationStudio from '$lib/components/CreationStudio.svelte';
  import { beatToolGroups } from '$lib/creation/tools';
</script>
<svelte:head>
  <title>Beat Making Studio | Learnzur</title>
  <meta name="description" content="Make loops, melodies, and preview clips. Approved beats can become public projects and sell on Lanmat." />
</svelte:head>
<CreationStudio kind="beat" heading="Beat Making Studio" lead="Make loops, melodies, and preview clips. Approved beats can become public projects and sell on Lanmat." toolGroups={beatToolGroups} />
