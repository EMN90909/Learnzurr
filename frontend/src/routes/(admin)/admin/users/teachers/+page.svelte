<script lang="ts">
  import { adminData } from '$lib/api';
  let loading=false; let message='Ready';
  async function refresh(){ loading=true; const res=await adminData('users/teachers'); loading=false; message=res.ok ? 'Loaded from secure admin API / Supabase boundary.' : res.error; }
</script>
<section class="page admin-page"><h1>Manage teachers and organizations</h1><p class="muted">Role-protected, audit-logged, backend-authorized admin page.</p><div class="card"><h3>Admin can</h3><ul><li>search teachers</li><li>filter county/subject/status</li><li>view certificate</li><li>approve/reject/suspend/ban</li><li>view classes</li><li>view earnings summary</li></ul><button on:click={refresh} disabled={loading}>{loading?'Loading…':'Load secure admin data'}</button><p class="muted">{message}</p></div></section>
