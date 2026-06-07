<script lang="ts">
  import { api } from '$lib/api';
  async function schedule(){ await api('/classroom/meetings', { method:'POST', body: JSON.stringify({ title:'Revision meeting' }) }); }
</script>
<svelte:head><title>Teacher Meetings | Learnzur</title><meta name="description" content="Schedule and manage Learnzur teacher meetings with reminders and live classroom tools." /></svelte:head>
<section class="page"><h1>Teacher meetings</h1><p class="muted">Schedule meetings, ring learners when they start, and use the same video and board tools as live class.</p><button on:click={schedule}>Schedule Meeting</button><div class="card"><h2>Meeting controls</h2><p>Start meeting, invite participants, manage learners, end meeting, and save recording references only for authorized users.</p></div></section>
