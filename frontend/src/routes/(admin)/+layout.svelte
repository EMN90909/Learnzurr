<script lang="ts">
  let { children } = $props();
</script>
<div class="dashboard-layout">
  <aside class="sidebar">
    <div class="brand">Learnzur Admin</div>
      <a href='/admin/dashboard'>Dashboard</a>
      <a href='/admin/users/teachers'>Users</a>
      <a href='/admin/users/parents'>Users</a>
      <a href='/admin/users/learners'>Users</a>
      <a href='/admin/classes'>Classes</a>
      <a href='/admin/mearn/overview'>Mearn</a>
      <a href='/admin/mearn/splits'>Mearn</a>
      <a href='/admin/mearn/payouts'>Mearn</a>
      <a href='/admin/mearn/treasury'>Mearn</a>
      <a href='/admin/lanmat/pending'>Lanmat</a>
      <a href='/admin/lanmat/flagged'>Lanmat</a>
      <a href='/admin/flag/chat'>Flag</a>
  </aside>
  <main class="dashboard-main">
    {@render children()}
  </main>
</div>
