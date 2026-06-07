<script lang="ts">
  import { api } from '$lib/api';
  const tools = ['Start live class','Teacher camera and mic','Draw on board','Type text on board','Erase or clear board','Upload board image','Move and resize image','See hand raises','Manage camera slots','End class'];
  async function startRoom(){ await api('/classroom/rooms', { method:'POST', body: JSON.stringify({ class_id:'active-class' }) }); }
</script>
<svelte:head><title>Teacher Live Classroom | Learnzur</title><meta name="description" content="Start a Learnzur live class with video, whiteboard, chat, hand raises, and attendance." /></svelte:head>
<section class="page"><h1>Teacher live classroom</h1><p class="muted">Teach with video, audio, realtime board, safe chat, hand raises, attendance, and meeting reminders.</p><button on:click={startRoom}>Start Live Class</button><div class="grid">{#each tools as tool}<div class="card"><h3>{tool}</h3><p class="muted">Teacher-controlled and synced through the Classroom engine.</p></div>{/each}</div><div class="card"><h2>Realtime whiteboard</h2><p>Draw, type, erase, upload images, move images, resize images, clear the board, and restore the board when learners reconnect.</p></div><div class="card"><h2>Video rules</h2><p>1 teacher, up to 50 students, and a maximum of 10 active cameras. Learners can still hear, chat, and view the board without camera.</p></div></section>
