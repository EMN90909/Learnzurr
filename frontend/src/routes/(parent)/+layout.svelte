<script lang="ts">
  let { children } = $props();
</script>
<div class="dashboard-layout">
  <aside class="sidebar">
    <div class="brand">Learnzur Parent</div>
      <a href='/parent/dashboard'>Dashboard</a>
      <a href='/parent/children'>Children</a>
      <a href='/parent/progress/demo'>Progress</a>
      <a href='/parent/classes'>Classes</a>
      <a href='/parent/payments/enroll'>Payments</a>
      <a href='/parent/payments/lanmat'>Payments</a>
      <a href='/parent/payments/history'>Payments</a>
      <a href='/parent/results'>Results</a>
      <a href='/parent/messages'>Messages</a>
      <a href='/parent/chat-monitor'>Chat-Monitor</a>
      <a href='/parent/notifications'>Notifications</a>
      <a href='/parent/settings'>Settings</a>
  </aside>
  <main class="dashboard-main">
    {@render children()}
  </main>
</div>
