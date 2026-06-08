<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
</script>

<section class="page" style="display: flex; flex-direction: column; gap: 2rem;">
  <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
    <div>
      <p class="eyebrow">Learner Dashboard</p>
      <h1 style="font-size: 2.5rem; font-weight: 900;">Welcome back, Learner!</h1>
      <p class="muted">Track your progress, join live classes, and build amazing projects.</p>
    </div>
    <div style="display: flex; gap: 0.75rem;">
      <a href="/learner/studio" class="button">
        <Icon name="plus" size={18} />
        <span>Open Studio</span>
      </a>
    </div>
  </div>

  <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem;">
    <div class="card" style="display: flex; align-items: center; gap: 1rem; border-left: 4px solid #10b981;">
      <div style="background: #ecfdf5; color: #10b981; width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
        <Icon name="trophy" size={24} />
      </div>
      <div>
        <p class="muted" style="font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">My Stars</p>
        <h3 style="font-size: 1.5rem; font-weight: 800;">120 Stars</h3>
      </div>
    </div>

    <div class="card" style="display: flex; align-items: center; gap: 1rem; border-left: 4px solid #0f766e;">
      <div style="background: #f0fdfa; color: #0f766e; width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
        <Icon name="award" size={24} />
      </div>
      <div>
        <p class="muted" style="font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">Badges Unlocked</p>
        <h3 style="font-size: 1.5rem; font-weight: 800;">5 Badges</h3>
      </div>
    </div>

    <div class="card" style="display: flex; align-items: center; gap: 1rem; border-left: 4px solid #f59e0b;">
      <div style="background: #fffbeb; color: #f59e0b; width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
        <Icon name="activity" size={24} />
      </div>
      <div>
        <p class="muted" style="font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">Current Streak</p>
        <h3 style="font-size: 1.5rem; font-weight: 800;">4 Days</h3>
      </div>
    </div>
  </div>

  <div class="grid" style="grid-template-columns: 2fr 1fr; gap: 2rem; align-items: start;">
    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
      <div class="card" style="display: flex; flex-direction: column; gap: 1rem;">
        <h2>My Live Classes</h2>
        <p class="muted">Join your scheduled live holiday tuition sessions here.</p>
        <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h4 style="font-weight: 700; font-size: 1.1rem;">Mathematics: Fractions & Decimals</h4>
            <p class="muted" style="font-size: 0.9rem;">Teacher: Emmanuel Nasongo · Today at 10:00 AM</p>
          </div>
          <a href="/learner/classroom/math-101" class="button">
            <Icon name="video" size={16} />
            <span>Join Class</span>
          </a>
        </div>
      </div>

      <div class="card" style="display: flex; flex-direction: column; gap: 1rem;">
        <h2>Recent Tasks & Assignments</h2>
        <p class="muted">Complete your quizzes and assignments to earn more stars.</p>
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h4 style="font-weight: 700;">Quiz 3: Introduction to Coding</h4>
              <p class="muted" style="font-size: 0.9rem;">Due in 2 days · 15 Stars reward</p>
            </div>
            <a href="/learner/tasks/quizzes" class="button secondary">Start</a>
          </div>
          <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h4 style="font-weight: 700;">Assignment 2: Creative Writing</h4>
              <p class="muted" style="font-size: 0.9rem;">Due in 5 days · 30 Stars reward</p>
            </div>
            <a href="/learner/tasks/assignments" class="button secondary">Start</a>
          </div>
        </div>
      </div>
    </div>

    <div class="card" style="display: flex; flex-direction: column; gap: 1rem;">
      <h2>Leaderboard</h2>
      <p class="muted">Top learners this week.</p>
      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid #e2e8f0;">
          <span style="font-weight: 700; color: #f59e0b;">1. Emmanuel N.</span>
          <span style="font-weight: 600;">450 Stars</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid #e2e8f0;">
          <span style="font-weight: 700; color: #94a3b8;">2. Mercy A.</span>
          <span style="font-weight: 600;">420 Stars</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid #e2e8f0;">
          <span style="font-weight: 700; color: #b45309;">3. John K.</span>
          <span style="font-weight: 600;">390 Stars</span>
        </div>
      </div>
      <a href="/learner/gamfy/leaderboard" class="button secondary" style="width: 100%;">View Full Leaderboard</a>
    </div>
  </div>
</section>