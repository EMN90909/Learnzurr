<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  import { page } from '$app/stores';

  const nav = [
    { label: 'Dashboard', href: '/teacher/dashboard', icon: 'dashboard' },
    { label: 'My Profile', href: '/teacher/profile', icon: 'user' },
    { label: 'My Classes', href: '/teacher/classes', icon: 'book' },
    { label: 'Quizzes', href: '/teacher/lms/quizzes', icon: 'help' },
    { label: 'Tests', href: '/teacher/lms/tests', icon: 'award' },
    { label: 'Assignments', href: '/teacher/lms/assignments', icon: 'book' },
    { label: 'Grades', href: '/teacher/lms/grades', icon: 'trophy' },
    { label: 'Progress', href: '/teacher/lms/progress', icon: 'activity' },
    { label: 'Timetable', href: '/teacher/timetable', icon: 'calendar' },
    { label: 'Meetings', href: '/teacher/meetings', icon: 'video' },
    { label: 'Earnings', href: '/teacher/earnings', icon: 'dollar' },
    { label: 'Payouts', href: '/teacher/payouts', icon: 'dollar' },
    { label: 'Lanmat Store', href: '/teacher/lanmat', icon: 'store' },
    { label: 'Messages', href: '/teacher/messages', icon: 'message' },
    { label: 'Notifications', href: '/teacher/notifications', icon: 'bell' },
    { label: 'Settings', href: '/teacher/settings', icon: 'settings' }
  ] as const;
</script>

<div class="layout">
  <aside class="sidebar">
    <div class="sidebar-header" style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem;">
      <div class="logo-mark" style="background: #0f766e; color: white; font-weight: 900; font-size: 1.25rem; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 10px;">T</div>
      <div>
        <h2 style="font-size: 1.1rem; margin: 0; color: white;">Learnzur Teacher</h2>
        <span class="badge" style="font-size: 0.7rem; background: #1e293b; color: #10b981; padding: 0.1rem 0.4rem; border-radius: 999px; font-weight: 600;">Verified</span>
      </div>
    </div>
    
    <nav style="display: flex; flex-direction: column; gap: 0.25rem;">
      {#each nav as item}
        <a 
          href={item.href} 
          class:active={$page.url.pathname === item.href}
          style="display: flex; align-items: center; gap: 0.75rem; padding: 0.65rem 0.85rem; border-radius: 8px; color: #94a3b8; font-weight: 500; font-size: 0.9rem; transition: all 0.2s ease;"
          on:mouseenter={(e) => { if ($page.url.pathname !== item.href) e.currentTarget.style.color = 'white'; }}
          on:mouseleave={(e) => { if ($page.url.pathname !== item.href) e.currentTarget.style.color = '#94a3b8'; }}
        >
          <Icon name={item.icon} size={16} />
          <span>{item.label}</span>
        </a>
      {/each}
    </nav>
  </aside>

  <main class="content">
    <slot />
  </main>
</div>

<style>
  .active {
    background: #0f766e !important;
    color: white !important;
  }
</style>