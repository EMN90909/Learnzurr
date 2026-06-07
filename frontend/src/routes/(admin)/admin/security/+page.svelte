<script lang="ts">
  import { adminData } from '$lib/api';
  let loading=false; let message='Ready';
  async function refresh(){ loading=true; const res=await adminData('security'); loading=false; message=res.ok ? 'Loaded from secure admin API / Supabase boundary.' : res.error; }
</script>
<section class="page admin-page"><h1>Security center</h1><p class="muted">Role-protected, audit-logged, backend-authorized admin page.</p><div class="card"><h3>Admin can</h3><ul><li>audit logs</li><li>fraud alerts</li><li>IP blacklist</li><li>user blacklist</li><li>suspicious logins</li><li>sandbox abuse</li><li>classroom abuse</li></ul><button on:click={refresh} disabled={loading}>{loading?'Loading…':'Load secure admin data'}</button><p class="muted">{message}</p></div></section>
