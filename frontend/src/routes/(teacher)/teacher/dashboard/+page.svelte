<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
</script>

<section class="page" style="display: flex; flex-direction: column; gap: 2rem;">
  <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
    <div>
      <p class="eyebrow">Teacher Dashboard</p>
      <h1 style="font-size: 2.5rem; font-weight: 900;">Welcome back, Teacher!</h1>
      <p class="muted">Manage your classes, schedule meetings, and track your earnings.</p>
    </div>
    <div style="display: flex; gap: 0.75rem;">
      <a href="/teacher/classes" class="button">
        <Icon name="plus" size={18} />
        <span>Create Class</span>
      </a>
    </div>
  </div>

  <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem;">
    <div class="card" style="display: flex; align-items: center; gap: 1rem; border-left: 4px solid #0f766e;">
      <div style="background: #f0fdfa; color: #0f766e; width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
        <Icon name="book" size={24} />
      </div>
      <div>
        <p class="muted" style="font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">My Classes</p>
        <h3 style="font-size: 1.5rem; font-weight: 800;">4 Active</h3>
      </div>
    </div>

    <div class="card" style="display: flex; align-items: center; gap: 1rem; border-left: 4px solid #10b981;">
      <div style="background: #ecfdf5; color: #10b981; width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
        <Icon name="users" size={24} />
      </div>
      <div>
        <p class="muted" style="font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">Total Students</p>
        <h3 style="font-size: 1.5rem; font-weight: 800;">48 Enrolled</h3>
      </div>
    </div>

    <div class="card" style="display: flex; align-items: center; gap: 1rem; border-left: 4px solid #f59e0b;">
      <div style="background: #fffbeb; color: #f59e0b; width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
        <Icon name="dollar" size={24} />
      </div>
      <div>
        <p class="muted" style="font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">Total Earnings</p>
        <h3 style="font-size: 1.5rem; font-weight: 800;">KSh 72,000</h3>
      </div>
    </div>
  </div>

  <div class="grid" style="grid-template-columns: 2fr 1fr; gap: 2rem; align-items: start;">
    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
      <div class="card" style="display: flex; flex-direction: column; gap: 1rem;">
        <h2>My Live Classes Today</h2>
        <p class="muted">Start your scheduled live holiday tuition sessions here.</p>
        <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h4 style="font-weight: 700; font-size: 1.1rem;">Mathematics: Fractions & Decimals</h4>
            <p class="muted" style="font-size: 0.9rem;">Today at 10:00 AM · 12 students enrolled</p>
          </div>
          <a href="/teacher/classroom/math-101" class="button">
            <Icon name="video" size={16} />
            <span>Start Class</span>
          </a>
        </div>
      </div>

      <div class="card" style="display: flex; flex-direction: column; gap: 1rem;">
        <h2>Recent LMS Submissions</h2>
        <p class="muted">Grade your students' quizzes and assignments.</p>
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h4 style="font-weight: 700;">Emmanuel Nasongo - Quiz 3</h4>
              <p class="muted" style="font-size: 0.9rem;">Submitted today · Introduction to Coding</p>
            </div>
            <a href="/teacher/lms/grades" class="button secondary">Grade</a>
          </div>
          <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h4 style="font-weight: 700;">Mercy Nasongo - Assignment 2</h4>
              <p class="muted" style="font-size: 0.9rem;">Submitted yesterday · Creative Writing</p>
            </div>
            <a href="/teacher/lms/grades" class="button secondary">Grade</a>
          </div>
        </div>
      </div>
    </div>

    <div class="card" style="display: flex; flex-direction: column; gap: 1rem;">
      <h2>Payout Requests</h2>
      <p class="muted">Request your earnings to be sent to your M-Pesa phone.</p>
      <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem;">
        <p class="muted" style="font-size: 0.9rem;">Available Balance</p>
        <h3 style="font-size: 1.75rem; font-weight: 800; color: #0f766e;">KSh 15,400</h3>
        <a href="/teacher/payouts" class="button" style="margin-top: 0.5rem; width: 100%;">
          <Icon name="dollar" size={16} />
          <span>Request Payout</span>
        </a>
      </div>
    </div>
  </div>
</section>