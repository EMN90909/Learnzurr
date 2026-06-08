<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  import { page } from '$app/stores';

  const nav = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: 'dashboard' },
    { label: 'Teachers', href: '/admin/users/teachers', icon: 'users' },
    { label: 'Parents', href: '/admin/users/parents', icon: 'users' },
    { label: 'Learners', href: '/admin/users/learners', icon: 'users' },
    { label: 'Classes', href: '/admin/classes', icon: 'book' },
    { label: 'Mearn Overview', href: '/admin/mearn/overview', icon: 'dollar' },
    { label: 'Payouts', href: '/admin/mearn/payouts', icon: 'dollar' },
    { label: 'Lanmat Pending', href: '/admin/lanmat/pending', icon: 'store' },
    { label: 'Gamfy Rules', href: '/admin/gamfy', icon: 'trophy' },
    { label: 'Contests', href: '/admin/contests', icon: 'award' },
    { label: 'Events', href: '/admin/events', icon: 'calendar' },
    { label: 'Sponsors', href: '/admin/sponsors', icon: 'users' },
    { label: 'NGO Applications', href: '/admin/ngo', icon: 'globe' },
    { label: 'Search Analytics', href: '/admin/find', icon: 'activity' },
    { label: 'Media Queue', href: '/admin/media', icon: 'image' },
    { label: 'Security Center', href: '/admin/security', icon: 'shield' },
    { label: 'Announcements', href: '/admin/notifications', icon: 'bell' },
    { label: 'Support Tickets', href: '/admin/help', icon: 'help' },
    { label: 'System Settings', href: '/admin/settings', icon: 'settings' }
  ] as const;
</script>

<div class="admin-shell">
  <aside class="admin-sidebar">
    <div class="sidebar-header">
      <div class="logo-mark">L</div>
      <div>
        <h2>Learnzur Admin</h2>
        <span class="badge">Super Admin</span>
      </div>
    </div>
    
    <nav class="sidebar-nav">
      {#each nav as item}
        <a 
          href={item.href} 
          class="nav-item" 
          class:active={$page.url.pathname === item.href}
        >
          <Icon name={item.icon} size={18} />
          <span>{item.label}</span>
        </a>
      {/each}
    </nav>
  </aside>

  <main class="admin-main">
    <header class="admin-header">
      <div class="header-title">
        <h1>Control Panel</h1>
        <p class="muted">Supabase-backed access. Actions require audit logs.</p>
      </div>
      <div class="header-actions">
        <a href="/login" class="button secondary">
          <Icon name="lock" size={16} />
          <span>Logout</span>
        </a>
      </div>
    </header>
    
    <div class="admin-content">
      <slot />
    </div>
  </main>
</div>

<style>
  .admin-shell {
    display: grid;
    grid-template-columns: 280px 1fr;
    min-height: 100vh;
    background: #f8fafc;
  }

  .admin-sidebar {
    background: #0f172a;
    color: #f8fafc;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
    border-right: 1px solid #1e293b;
    position: sticky;
    top: 0;
    height: 100vh;
    overflow-y: auto;
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .logo-mark {
    background: #10b981;
    color: white;
    font-weight: 900;
    font-size: 1.5rem;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
  }

  .sidebar-header h2 {
    font-size: 1.1rem;
    margin: 0;
    font-weight: 700;
  }

  .badge {
    font-size: 0.75rem;
    background: #1e293b;
    color: #10b981;
    padding: 0.15rem 0.5rem;
    border-radius: 999px;
    font-weight: 600;
  }

  .sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: 12px;
    text-decoration: none;
    color: #94a3b8;
    font-weight: 500;
    font-size: 0.95rem;
    transition: all 0.2s ease;
  }

  .nav-item:hover {
    background: #1e293b;
    color: #f8fafc;
  }

  .nav-item.active {
    background: #10b981;
    color: white;
  }

  .admin-main {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  .admin-header {
    background: white;
    border-bottom: 1px solid #e2e8f0;
    padding: 1.5rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header-title h1 {
    font-size: 1.5rem;
    margin: 0;
    color: #0f172a;
  }

  .header-title p {
    margin: 0.25rem 0 0;
    font-size: 0.9rem;
  }

  .admin-content {
    padding: 2rem;
    flex: 1;
    overflow-y: auto;
  }

  @media (max-width: 1024px) {
    .admin-shell {
      grid-template-columns: 1fr;
    }
    .admin-sidebar {
      height: auto;
      position: static;
    }
  }
</style>