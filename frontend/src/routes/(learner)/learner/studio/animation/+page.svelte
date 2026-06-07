<script lang="ts">
  import CreationStudio from '$lib/components/CreationStudio.svelte';
  import { animationToolGroups } from '$lib/creation/tools';
</script>
<svelte:head>
  <title>Animation Studio | Learnzur</title>
  <meta name="description" content="Use simple story motion for ages 8-12 or advanced timeline, rigging, effects, audio, and export tools for ages 13-18." />
</svelte:head>
<CreationStudio kind="animation" heading="Animation Studio" lead="Use simple story motion for ages 8-12 or advanced timeline, rigging, effects, audio, and export tools for ages 13-18." toolGroups={animationToolGroups} />
