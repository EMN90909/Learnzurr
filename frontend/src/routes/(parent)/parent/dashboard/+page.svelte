<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
</script>

<section class="page" style="display: flex; flex-direction: column; gap: 2rem;">
  <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
    <div>
      <p class="eyebrow">Parent Dashboard</p>
      <h1 style="font-size: 2.5rem; font-weight: 900;">Welcome back, Parent!</h1>
      <p class="muted">Monitor your children's progress, manage enrollments, and view payment history.</p>
    </div>
    <div style="display: flex; gap: 0.75rem;">
      <a href="/parent/children" class="button">
        <Icon name="plus" size={18} />
        <span>Add Child</span>
      </a>
    </div>
  </div>

  <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem;">
    <div class="card" style="display: flex; align-items: center; gap: 1rem; border-left: 4px solid #0f766e;">
      <div style="background: #f0fdfa; color: #0f766e; width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
        <Icon name="users" size={24} />
      </div>
      <div>
        <p class="muted" style="font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">My Children</p>
        <h3 style="font-size: 1.5rem; font-weight: 800;">2 Registered</h3>
      </div>
    </div>

    <div class="card" style="display: flex; align-items: center; gap: 1rem; border-left: 4px solid #10b981;">
      <div style="background: #ecfdf5; color: #10b981; width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
        <Icon name="book" size={24} />
      </div>
      <div>
        <p class="muted" style="font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">Active Classes</p>
        <h3 style="font-size: 1.5rem; font-weight: 800;">3 Enrolled</h3>
      </div>
    </div>

    <div class="card" style="display: flex; align-items: center; gap: 1rem; border-left: 4px solid #f59e0b;">
      <div style="background: #fffbeb; color: #f59e0b; width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
        <Icon name="dollar" size={24} />
      </div>
      <div>
        <p class="muted" style="font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">Total Paid</p>
        <h3 style="font-size: 1.5rem; font-weight: 800;">KSh 4,500</h3>
      </div>
    </div>
  </div>

  <div class="grid" style="grid-template-columns: 2fr 1fr; gap: 2rem; align-items: start;">
    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
      <div class="card" style="display: flex; flex-direction: column; gap: 1rem;">
        <h2>Children Progress Overview</h2>
        <p class="muted">Quick summary of your children's learning activity.</p>
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div>
              <h4 style="font-weight: 700; font-size: 1.1rem;">Emmanuel Nasongo (Age 10)</h4>
              <p class="muted" style="font-size: 0.9rem;">Active in Mathematics & Coding · 92% Attendance</p>
            </div>
            <a href="/parent/progress/emmanuel" class="button secondary">View Progress</a>
          </div>
          <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div>
              <h4 style="font-weight: 700; font-size: 1.1rem;">Mercy Nasongo (Age 14)</h4>
              <p class="muted" style="font-size: 0.9rem;">Active in English & Creative Arts · 96% Attendance</p>
            </div>
            <a href="/parent/progress/mercy" class="button secondary">View Progress</a>
          </div>
        </div>
      </div>

      <div class="card" style="display: flex; flex-direction: column; gap: 1rem;">
        <h2>Recent Payments</h2>
        <p class="muted">Your recent M-Pesa transactions on Learnzur.</p>
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h4 style="font-weight: 700;">Mathematics Holiday Tuition</h4>
              <p class="muted" style="font-size: 0.9rem;">Paid via M-Pesa · Receipt: QWE123RTY</p>
            </div>
            <span style="font-weight: 700; color: #10b981;">KSh 1,500</span>
          </div>
          <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h4 style="font-weight: 700;">Coding Holiday Tuition</h4>
              <p class="muted" style="font-size: 0.9rem;">Paid via M-Pesa · Receipt: ASD456FGH</p>
            </div>
            <span style="font-weight: 700; color: #10b981;">KSh 1,500</span>
          </div>
        </div>
      </div>
    </div>

    <div class="card" style="display: flex; flex-direction: column; gap: 1rem;">
      <h2>Live Chat Monitor</h2>
      <p class="muted">Monitor your children's classroom chat in real-time.</p>
      <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem;">
        <h4 style="font-weight: 700;">Fractions & Decimals Class</h4>
        <p class="muted" style="font-size: 0.9rem;">Active now · 2 children in class</p>
        <a href="/parent/chat-monitor" class="button" style="margin-top: 0.5rem; width: 100%;">
          <Icon name="video" size={16} />
          <span>Monitor Chat</span>
        </a>
      </div>
    </div>
  </div>
</section>