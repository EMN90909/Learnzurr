<script lang="ts">
  import { adminData } from '$lib/api';
  let loading=false; let message='Ready';
  async function refresh(){ loading=true; const res=await adminData('help'); loading=false; message=res.ok ? 'Loaded from secure admin API / Supabase boundary.' : res.error; }
</script>
<section class="page admin-page"><h1>Support tickets and feedback</h1><p class="muted">Role-protected, audit-logged, backend-authorized admin page.</p><div class="card"><h3>Admin can</h3><ul><li>view tickets</li><li>assign</li><li>reply</li><li>close</li><li>mark bug/feature/payment/security</li></ul><button on:click={refresh} disabled={loading}>{loading?'Loading…':'Load secure admin data'}</button><p class="muted">{message}</p></div></section>
