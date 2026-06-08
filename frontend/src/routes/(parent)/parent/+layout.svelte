<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  import { page } from '$app/stores';

  const nav = [
    { label: 'Dashboard', href: '/parent/dashboard', icon: 'dashboard' },
    { label: 'My Children', href: '/parent/children', icon: 'users' },
    { label: 'Classes', href: '/parent/classes', icon: 'book' },
    { label: 'Enroll Child', href: '/parent/payments/enroll', icon: 'plus' },
    { label: 'Lanmat Purchases', href: '/parent/payments/lanmat', icon: 'store' },
    { label: 'Payment History', href: '/parent/payments/history', icon: 'dollar' },
    { label: 'Results & Grades', href: '/parent/results', icon: 'trophy' },
    { label: 'Messages', href: '/parent/messages', icon: 'message' },
    { label: 'Chat Monitor', href: '/parent/chat-monitor', icon: 'video' },
    { label: 'Notifications', href: '/parent/notifications', icon: 'bell' },
    { label: 'Settings', href: '/parent/settings', icon: 'settings' }
  ] as const;
</script>

<div class="layout">
  <aside class="sidebar">
    <div class="sidebar-header" style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem;">
      <div class="logo-mark" style="background: #0f766e; color: white; font-weight: 900; font-size: 1.25rem; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 10px;">P</div>
      <div>
        <h2 style="font-size: 1.1rem; margin: 0; color: white;">Learnzur Parent</h2>
        <span class="badge" style="font-size: 0.7rem; background: #1e293b; color: #10b981; padding: 0.1rem 0.4rem; border-radius: 999px; font-weight: 600;">Parent</span>
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