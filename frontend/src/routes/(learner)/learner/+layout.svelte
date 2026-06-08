<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  import StudioLauncher from '$lib/components/StudioLauncher.svelte';
  import { page } from '$app/stores';

  const nav = [
    { label: 'Dashboard', href: '/learner/dashboard', icon: 'dashboard' },
    { label: 'My Library', href: '/learner/library', icon: 'book' },
    { label: 'Studio', href: '/learner/studio', icon: 'plus' },
    { label: 'Explore', href: '/learner/explore', icon: 'globe' },
    { label: 'Lanmat Market', href: '/learner/lanmat', icon: 'store' },
    { label: 'Quizzes', href: '/learner/tasks/quizzes', icon: 'help' },
    { label: 'Tests', href: '/learner/tasks/tests', icon: 'award' },
    { label: 'Assignments', href: '/learner/tasks/assignments', icon: 'book' },
    { label: 'My Stars', href: '/learner/gamfy/stars', icon: 'trophy' },
    { label: 'Badges', href: '/learner/gamfy/badges', icon: 'award' },
    { label: 'Streaks', href: '/learner/gamfy/streaks', icon: 'activity' },
    { label: 'Leaderboard', href: '/learner/gamfy/leaderboard', icon: 'trophy' },
    { label: 'Contests', href: '/learner/contests', icon: 'award' },
    { label: 'Class Chat', href: '/learner/chat', icon: 'message' },
    { label: 'Meetings', href: '/learner/meetings', icon: 'video' },
    { label: 'Notifications', href: '/learner/notifications', icon: 'bell' },
    { label: 'Settings', href: '/learner/settings', icon: 'settings' }
  ] as const;
</script>

<div class="layout">
  <aside class="sidebar">
    <div class="sidebar-header" style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem;">
      <div class="logo-mark" style="background: #10b981; color: white; font-weight: 900; font-size: 1.25rem; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 10px;">L</div>
      <div>
        <h2 style="font-size: 1.1rem; margin: 0; color: white;">Learnzur Learner</h2>
        <span class="badge" style="font-size: 0.7rem; background: #1e293b; color: #10b981; padding: 0.1rem 0.4rem; border-radius: 999px; font-weight: 600;">Junior</span>
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
  
  <StudioLauncher />
</div>

<style>
  .active {
    background: #10b981 !important;
    color: white !important;
  }
</style>