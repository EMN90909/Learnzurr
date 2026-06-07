<script lang="ts">
  const meetings = ['Math revision', 'Code club check-in', 'Science contest briefing'];
</script>
<svelte:head><title>Learner Meetings | Learnzur</title><meta name="description" content="View and join scheduled Learnzur learning meetings." /></svelte:head>
<section class="page"><h1>My meetings</h1><p class="muted">Join only the meetings you are invited to. You will get a ring when it is time.</p><div class="grid">{#each meetings as meeting}<div class="card"><h3>{meeting}</h3><p class="muted">Reminder active. Join button appears when the teacher starts.</p></div>{/each}</div></section>
