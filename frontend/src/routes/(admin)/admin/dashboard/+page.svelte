<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  import { adminData } from '$lib/api';

  let loading = false;
  let message = 'Ready';

  async function refresh() {
    loading = true;
    const res = await adminData('dashboard');
    loading = false;
    message = res.ok ? 'Loaded from secure admin API / Supabase boundary.' : res.error;
  }
</script>

<section class="page" style="display: flex; flex-direction: column; gap: 2rem;">
  <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
    <div>
      <p class="eyebrow">Admin Dashboard</p>
      <h1 style="font-size: 2.5rem; font-weight: 900;">Platform Overview</h1>
      <p class="muted">Monitor platform activity, manage users, and review security alerts.</p>
    </div>
    <div style="display: flex; gap: 0.75rem;">
      <button on:click={refresh} disabled={loading} class="button">
        <Icon name="activity" size={18} />
        <span>{loading ? 'Refreshing…' : 'Refresh Stats'}</span>
      </button>
    </div>
  </div>

  <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem;">
    <div class="card" style="display: flex; align-items: center; gap: 1rem; border-left: 4px solid #0f766e;">
      <div style="background: #f0fdfa; color: #0f766e; width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
        <Icon name="users" size={24} />
      </div>
      <div>
        <p class="muted" style="font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">Teachers</p>
        <h3 style="font-size: 1.5rem; font-weight: 800;">124 Active</h3>
      </div>
    </div>

    <div class="card" style="display: flex; align-items: center; gap: 1rem; border-left: 4px solid #10b981;">
      <div style="background: #ecfdf5; color: #10b981; width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
        <Icon name="users" size={24} />
      </div>
      <div>
        <p class="muted" style="font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">Learners</p>
        <h3 style="font-size: 1.5rem; font-weight: 800;">1,420 Active</h3>
      </div>
    </div>

    <div class="card" style="display: flex; align-items: center; gap: 1rem; border-left: 4px solid #f59e0b;">
      <div style="background: #fffbeb; color: #f59e0b; width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
        <Icon name="book" size={24} />
      </div>
      <div>
        <p class="muted" style="font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">Classes</p>
        <h3 style="font-size: 1.5rem; font-weight: 800;">84 Active</h3>
      </div>
    </div>

    <div class="card" style="display: flex; align-items: center; gap: 1rem; border-left: 4px solid #ef4444;">
      <div style="background: #fef2f2; color: #ef4444; width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
        <Icon name="alert" size={24} />
      </div>
      <div>
        <p class="muted" style="font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">Alerts</p>
        <h3 style="font-size: 1.5rem; font-weight: 800;">2 Pending</h3>
      </div>
    </div>
  </div>

  <div class="grid" style="grid-template-columns: 2fr 1fr; gap: 2rem; align-items: start;">
    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
      <div class="card" style="display: flex; flex-direction: column; gap: 1rem;">
        <h2>Recent Security Alerts</h2>
        <p class="muted">Real-time security monitoring and fraud detection.</p>
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          <div style="border: 1px solid #fee2e2; background: #fff5f5; border-radius: 12px; padding: 1rem; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h4 style="font-weight: 700; color: #b91c1c;">Suspicious Login Attempt</h4>
              <p class="muted" style="font-size: 0.9rem;">IP: 197.248.31.92 · Nairobi, Kenya · 10 mins ago</p>
            </div>
            <a href="/admin/security" class="button secondary" style="color: #b91c1c; border-color: #fca5a5;">Investigate</a>
          </div>
          <div style="border: 1px solid #fee2e2; background: #fff5f5; border-radius: 12px; padding: 1rem; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h4 style="font-weight: 700; color: #b91c1c;">Duplicate Payment Attempt</h4>
              <p class="muted" style="font-size: 0.9rem;">M-Pesa Ref: QWE123RTY · 1 hour ago</p>
            </div>
            <a href="/admin/security" class="button secondary" style="color: #b91c1c; border-color: #fca5a5;">Investigate</a>
          </div>
        </div>
      </div>
    </div>

    <div class="card" style="display: flex; flex-direction: column; gap: 1rem;">
      <h2>System Status</h2>
      <p class="muted">All engines are fully operational.</p>
      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid #e2e8f0;">
          <span style="font-weight: 600;">Gamfy Engine</span>
          <span style="color: #10b981; font-weight: 700;">OK</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid #e2e8f0;">
          <span style="font-weight: 600;">Mearn Engine</span>
          <span style="color: #10b981; font-weight: 700;">OK</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid #e2e8f0;">
          <span style="font-weight: 600;">Classroom Engine</span>
          <span style="color: #10b981; font-weight: 700;">OK</span>
        </div>
      </div>
      <p class="muted" style="font-size: 0.85rem; text-align: center; margin-top: 0.5rem;">API Status: {message}</p>
    </div>
  </div>
</section>