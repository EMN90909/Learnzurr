<script lang="ts">
  import { api } from '$lib/api';
  const learnerFeatures = ['Join class','Watch teacher video','See board changes live','Read typed board text','See uploaded images','Chat when allowed','Raise hand','Reconnect after network drop'];
  async function joinRoom(){ await api('/classroom/rooms/active-room/join', { method:'POST', body: JSON.stringify({ role:'learner' }) }); }
</script>
<svelte:head><title>Learner Classroom | Learnzur</title><meta name="description" content="Join a Learnzur live class and follow the teacher video, board, chat, and hand raise tools." /></svelte:head>
<section class="page"><h1>Join live class</h1><p class="muted">For phones and slow networks: board and audio keep working even when camera is not available.</p><button on:click={joinRoom}>Join Class</button><div class="grid">{#each learnerFeatures as feature}<div class="card"><h3>{feature}</h3><p class="muted">Simple, safe and synced in realtime.</p></div>{/each}</div></section>
