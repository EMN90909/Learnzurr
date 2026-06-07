<script lang="ts">
  import CreationStudio from '$lib/components/CreationStudio.svelte';
  import { websiteAppToolGroups } from '$lib/creation/tools';
</script>
<svelte:head>
  <title>Website / App Studio | Learnzur</title>
  <meta name="description" content="Create a light website or app with pages, buttons, cards, colours, preview, and safe code export." />
</svelte:head>
<CreationStudio kind="website-app" heading="Website / App Studio" lead="Create a light website or app with pages, buttons, cards, colours, preview, and safe code export." toolGroups={websiteAppToolGroups} />
