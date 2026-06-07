<script lang="ts">
  const chat = ['Teacher: Welcome to class.', 'Learner: Please repeat the fraction example.'];
</script>
<svelte:head><title>Parent Chat Monitor | Learnzur</title><meta name="description" content="Parents can safely view child classroom chat read-only where allowed." /></svelte:head>
<section class="page"><h1>Class chat monitor</h1><p class="muted">Read-only safety view. Parents can monitor allowed child classroom chat but cannot speak as the learner.</p><div class="grid">{#each chat as item}<div class="card"><p>{item}</p><small>Scanned by Flag before delivery.</small></div>{/each}</div></section>
