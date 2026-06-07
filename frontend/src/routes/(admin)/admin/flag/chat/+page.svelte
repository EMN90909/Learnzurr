<script lang="ts">
  import { onMount } from 'svelte';
  import { api } from '$lib/api';
  let items: unknown[] = [];
  let status = 'Loading chat sandbox scans...';
  onMount(async () => {
    const res = await api('/admin/flag/chat-sandbox');
    if (res.ok) {
      items = (res.data as { items?: unknown[] }).items ?? [];
      status = 'Loaded AI chat sandbox records';
    } else status = res.error;
  });
</script>
<section class="page"><h1>AI Chat Sandbox</h1><p class="muted">Chats are saved as chat + user records before delivery. Bad or high-severity scans create ban/restriction actions.</p><div class="card"><strong>{status}</strong><pre>{JSON.stringify(items, null, 2)}</pre></div></section>
