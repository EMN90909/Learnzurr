<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
</script>

<svelte:head>
  <title>Learnzur — Kenyan Holiday Tuition, Creative Studio and Public Projects</title>
  <meta name="description" content="Learnzur helps Kenyan learners join holiday tuition, create animations, games, apps, graphics and beats, then publish safe public projects." />
  <meta property="og:title" content="Learnzur" />
  <meta property="og:description" content="Holiday tuition, learner studios, public projects and safe marketplace learning in Kenya." />
</svelte:head>

<section class="page hero" style="display: flex; flex-direction: column; gap: 4rem; padding: 5rem 1.5rem; text-align: center; align-items: center;">
  <div class="hero-content" style="max-width: 800px; display: flex; flex-direction: column; gap: 1.5rem;">
    <p class="eyebrow" style="font-size: 0.9rem; color: #0f766e; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">Kenyan holiday tuition for curious learners</p>
    <h1 style="font-size: 3.5rem; font-weight: 900; line-height: 1.15; color: #0f172a; letter-spacing: -0.03em;">Learnzur helps teachers teach, parents follow progress, and learners build real skills.</h1>
    <p class="lead" style="font-size: 1.25rem; color: #475569; max-width: 700px; margin: 0 auto;">Mobile-first classes, LMS, coding projects, marketplace, rewards, contests, and M-Pesa payments in one calm education platform.</p>
    <div class="hero-actions" style="display: flex; gap: 1rem; justify-content: center; margin-top: 1.5rem;">
      <a class="button" href="/register" style="padding: 1rem 2.25rem; font-size: 1rem; border-radius: 8px; font-weight: 600;">Start learning</a>
      <a class="button secondary" href="/explore" style="padding: 1rem 2.25rem; font-size: 1rem; border-radius: 8px; font-weight: 600; border: 1px solid #cbd5e1;">Explore classes</a>
    </div>
  </div>

  <div class="grid" style="width: 100%; max-width: 1100px; margin-top: 3rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
    <article class="card" style="text-align: left; display: flex; flex-direction: column; gap: 1rem; border-top: 4px solid #0f766e; padding: 2.5rem; border-radius: 16px; background: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
      <div style="color: #0f766e; background: #f0fdfa; width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
        <Icon name="users" size={24} />
      </div>
      <h3 style="font-size: 1.35rem; font-weight: 700; color: #0f172a;">Parents</h3>
      <p class="muted" style="line-height: 1.6; color: #475569;">Enroll children, pay securely via M-Pesa, monitor grades, and approve learning resource purchases.</p>
    </article>

    <article class="card" style="text-align: left; display: flex; flex-direction: column; gap: 1rem; border-top: 4px solid #10b981; padding: 2.5rem; border-radius: 16px; background: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
      <div style="color: #10b981; background: #ecfdf5; width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
        <Icon name="book" size={24} />
      </div>
      <h3 style="font-size: 1.35rem; font-weight: 700; color: #0f172a;">Teachers</h3>
      <p class="muted" style="line-height: 1.6; color: #475569;">Create classes, manage quizzes, teach live with interactive whiteboards, and request payouts directly.</p>
    </article>

    <article class="card" style="text-align: left; display: flex; flex-direction: column; gap: 1rem; border-top: 4px solid #f59e0b; padding: 2.5rem; border-radius: 16px; background: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
      <div style="color: #f59e0b; background: #fffbeb; width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
        <Icon name="trophy" size={24} />
      </div>
      <h3 style="font-size: 1.35rem; font-weight: 700; color: #0f172a;">Learners</h3>
      <p class="muted" style="line-height: 1.6; color: #475569;">Join live classes, create animations, beats, or code projects, earn stars, and enter exciting contests.</p>
    </article>
  </div>
</section>