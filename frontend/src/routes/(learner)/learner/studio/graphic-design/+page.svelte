<script lang="ts">
  import CreationStudio from '$lib/components/CreationStudio.svelte';
  import { graphicToolGroups } from '$lib/creation/tools';
</script>
<svelte:head>
  <title>Graphic Design Studio | Learnzur</title>
  <meta name="description" content="Ultra-light graphic design for posters, cards, thumbnails, badges, and class graphics without heavy tools." />
</svelte:head>
<CreationStudio kind="graphic-design" heading="Graphic Design Studio" lead="Ultra-light graphic design for posters, cards, thumbnails, badges, and class graphics without heavy tools." toolGroups={graphicToolGroups} />
