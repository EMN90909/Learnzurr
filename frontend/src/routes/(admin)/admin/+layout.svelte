<script lang="ts">
  const nav = [
    ['Dashboard','/admin/dashboard'],['Teachers','/admin/users/teachers'],['Parents','/admin/users/parents'],['Learners','/admin/users/learners'],['Classes','/admin/classes'],['Mearn','/admin/mearn/overview'],['Payouts','/admin/mearn/payouts'],['Lanmat','/admin/lanmat/pending'],['Gamfy','/admin/gamfy'],['Contests','/admin/contests'],['Events','/admin/events'],['Sponsors','/admin/sponsors'],['NGO','/admin/ngo'],['Find','/admin/find'],['Media','/admin/media'],['Security','/admin/security'],['Notifications','/admin/notifications'],['Help','/admin/help'],['Settings','/admin/settings']
  ];
</script>
<div class="admin-shell"><aside class="card"><h2>Learnzur Admin</h2><p class="muted">Supabase-backed access. Actions require audit logs.</p>{#each nav as item}<a href={item[1]}>{item[0]}</a>{/each}</aside><main><slot /></main></div>
<style>.admin-shell{display:grid;grid-template-columns:260px 1fr;gap:1rem;padding:1rem}.admin-shell aside{position:sticky;top:1rem;height:max-content}.admin-shell a{display:block;padding:.55rem .6rem;border-radius:10px;text-decoration:none;color:#0f172a}.admin-shell a:hover{background:#ecfdf5}@media(max-width:800px){.admin-shell{grid-template-columns:1fr}.admin-shell aside{position:static}}</style>
