<script lang="ts">
  import CreationStudio from '$lib/components/CreationStudio.svelte';
  import { gameToolGroups } from '$lib/creation/tools';
</script>
<svelte:head>
  <title>Game Studio | Learnzur</title>
  <meta name="description" content="Build a simple learning game with characters, levels, rules, scoring, safe previews, and public publishing after review." />
</svelte:head>
<CreationStudio kind="game" heading="Game Studio" lead="Build a simple learning game with characters, levels, rules, scoring, safe previews, and public publishing after review." toolGroups={gameToolGroups} />
