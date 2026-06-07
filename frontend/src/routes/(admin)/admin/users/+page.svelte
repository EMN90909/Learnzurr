<script lang="ts">
  import { onMount } from 'svelte';
  import { adminUsers } from '$lib/api';
  const scope = '';
  const title = 'All Users';
  let rows: unknown[] = [];
  let status = 'Loading from Supabase-backed admin API...';
  onMount(async () => {
    const res = await adminUsers(scope);
    if (res.ok) {
      rows = (res.data as { items?: unknown[] }).items ?? [];
      status = 'Loaded from Supabase admin records';
    } else {
      status = res.error;
    }
  });
</script>
<section class="page">
  <h1>{title}</h1>
  <p class="muted">Admin access is controlled by the Supabase <code>admin_portal_access</code> table, not by hardcoded frontend checks.</p>
  <div class="card"><strong>{status}</strong><pre>{JSON.stringify(rows, null, 2)}</pre></div>
</section>
