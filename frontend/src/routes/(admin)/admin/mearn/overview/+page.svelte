<script lang="ts">
  import { adminData } from '$lib/api';
  let loading=false; let message='Ready';
  async function refresh(){ loading=true; const res=await adminData('mearn/overview'); loading=false; message=res.ok ? 'Loaded from secure admin API / Supabase boundary.' : res.error; }
</script>
<section class="page admin-page"><h1>Mearn treasury overview</h1><p class="muted">Role-protected, audit-logged, backend-authorized admin page.</p><div class="card"><h3>Admin can</h3><ul><li>total revenue</li><li>teacher earnings</li><li>platform fees</li><li>royalties</li><li>refund requests</li><li>treasury pots</li></ul><button on:click={refresh} disabled={loading}>{loading?'Loading…':'Load secure admin data'}</button><p class="muted">{message}</p></div></section>
