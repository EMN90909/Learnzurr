<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from '$lib/components/Icon.svelte';

  type Stats = { activeClasses: number; verifiedTeachers: number; learnersEnrolled: number };
  type FeaturedClass = {
    id: string;
    title: string;
    subject: string;
    teacherName: string;
    price: string;
    ageGroup: string;
    enrollCount: number;
    href: string;
  };

  let menuOpen = false;
  let stats: Stats = { activeClasses: 0, verifiedTeachers: 0, learnersEnrolled: 0 };
  let subjects = ['Mathematics', 'English', 'Science', 'Kiswahili', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Coding', 'Art', 'Music'];
  let classes: FeaturedClass[] = [];

  const roles = [
    {
      icon: 'users',
      title: 'For parents',
      subtitle: 'Clear oversight from payment to progress.',
      steps: ['Create account + add children', 'Browse and pay for classes', 'Monitor progress and grades']
    },
    {
      icon: 'book',
      title: 'For teachers',
      subtitle: 'Teach, manage and earn from one place.',
      steps: ['Sign up + upload certificate', 'Create and run classes', 'Earn via M-Pesa payouts']
    },
    {
      icon: 'trophy',
      title: 'For learners',
      subtitle: 'Learn live, build projects and stay motivated.',
      steps: ['Parent creates your account', 'Join live classes + submit tasks', 'Earn stars, badges, and prizes']
    }
  ] as const;

  const features = [
    ['video', 'Live classes', 'One teacher, up to 50 learners, shared whiteboard and moderated chat.'],
    ['activity', 'Code sandbox', 'Write and run HTML, Python, PHP and more safely in the browser.'],
    ['store', 'Marketplace', 'Teachers and senior learners sell notes and books with 90% royalty.'],
    ['trophy', 'Gamification', 'Stars, points, badges, streaks and leaderboards keep learners moving.'],
    ['book', 'Full LMS', 'Quizzes, tests, assignments, grades, timetable and progress tracking.'],
    ['award', 'Contests', 'Web and physical contests with prizes and sponsor support.']
  ] as const;

  async function loadPublicData() {
    const [statsRes, subjectsRes, classesRes] = await Promise.allSettled([
      fetch('/api/public/stats').then((r) => r.json()),
      fetch('/api/public/subjects').then((r) => r.json()),
      fetch('/api/public/featured-classes').then((r) => r.json())
    ]);

    if (statsRes.status === 'fulfilled') stats = statsRes.value;
    if (subjectsRes.status === 'fulfilled' && subjectsRes.value.subjects?.length) subjects = subjectsRes.value.subjects;
    if (classesRes.status === 'fulfilled' && classesRes.value.classes?.length) classes = classesRes.value.classes;
  }

  onMount(loadPublicData);
</script>

<svelte:head>
  <title>Learnzur — Kenya's #1 Holiday Tuition Platform</title>
  <meta name="description" content="Live online holiday tuition classes for Kenyan learners ages 8–18, with verified teachers, parent progress tracking, M-Pesa payments, and safe creative projects." />
</svelte:head>

<nav class="site-nav" aria-label="Primary navigation">
  <a class="brand" href="/" aria-label="Learnzur home">
    <span class="brand-mark">L</span>
    <span>Learnzur</span>
  </a>

  <button class="hamburger" aria-label="Toggle menu" aria-expanded={menuOpen} on:click={() => (menuOpen = !menuOpen)}>
    <span></span>
    <span></span>
    <span></span>
  </button>

  <div class:open={menuOpen} class="nav-links">
    <a href="/explore">Explore</a>
    <a href="/about">About</a>
    <a href="/contact">Contact</a>
  </div>

  <div class="nav-actions">
    <a class="login-link" href="/login">Login</a>
    <a class="button nav-button" href="/register">Get started</a>
  </div>
</nav>

<main class="visit-page">
  <section class="hero-section">
    <div class="hero-bg"></div>
    <div class="page hero-grid">
      <div class="hero-copy">
        <p class="eyebrow">Kenya's #1 Holiday Tuition Platform</p>
        <h1>Live online classes that make school holidays count.</h1>
        <p class="lead">
          Expert teachers, real progress, M-Pesa payments, safe learner accounts, and creative projects for Kenyan learners ages 8–18.
        </p>
        <div class="hero-actions">
          <a class="button hero-primary" href="/register">Start learning</a>
          <a class="button secondary hero-secondary" href="/register/teacher">Teach on Learnzur</a>
        </div>
        <div class="hero-trust">
          <span><Icon name="shield" size={16} /> Verified teachers</span>
          <span><Icon name="lock" size={16} /> Parent oversight</span>
          <span><Icon name="award" size={16} /> Rewards + contests</span>
        </div>
      </div>

      <div class="hero-preview" aria-label="Learnzur product preview">
        <div class="preview-card main-preview">
          <div class="preview-toolbar"><span></span><span></span><span></span></div>
          <div class="preview-header">
            <div>
              <small>Live room now</small>
              <h2>Form 1 Math Revision</h2>
            </div>
            <strong>92%</strong>
          </div>
          <div class="whiteboard-card">
            <span class="board-line wide"></span>
            <span class="board-line"></span>
            <span class="board-curve"></span>
          </div>
          <div class="preview-items">
            <div><Icon name="video" size={18} /><span>Live class</span></div>
            <div><Icon name="message" size={18} /><span>Moderated chat</span></div>
            <div><Icon name="trophy" size={18} /><span>Stars earned</span></div>
          </div>
        </div>
        <div class="mini-card attendance-card"><strong>48</strong><span>Learners joined</span></div>
        <div class="mini-card mpesa-card"><strong>M-Pesa</strong><span>Instant confirmation</span></div>
      </div>
    </div>
  </section>

  <section class="page stats-bar" aria-label="Live platform stats">
    <article><strong>{stats.activeClasses}</strong><span>Active classes</span></article>
    <article><strong>{stats.verifiedTeachers}</strong><span>Verified teachers</span></article>
    <article><strong>{stats.learnersEnrolled}</strong><span>Learners enrolled</span></article>
  </section>

  <section class="page section-block">
    <div class="section-heading">
      <p class="eyebrow">How it works</p>
      <h2>Simple journeys for parents, teachers and learners.</h2>
    </div>
    <div class="role-grid">
      {#each roles as role}
        <article class="role-card">
          <div class="role-icon"><Icon name={role.icon} size={24} /></div>
          <div>
            <h3>{role.title}</h3>
            <p>{role.subtitle}</p>
          </div>
          <ol>
            {#each role.steps as step, index}
              <li><span>{index + 1}</span>{step}</li>
            {/each}
          </ol>
        </article>
      {/each}
    </div>
  </section>

  <section class="page section-block">
    <div class="section-heading centered">
      <p class="eyebrow">Feature highlights</p>
      <h2>Everything needed for holiday learning in one polished system.</h2>
    </div>
    <div class="feature-grid">
      {#each features as item}
        <article class="feature-card">
          <span><Icon name={item[0]} size={23} /></span>
          <h3>{item[1]}</h3>
          <p>{item[2]}</p>
        </article>
      {/each}
    </div>
  </section>

  <section class="page subjects-section">
    <div class="section-heading compact">
      <p class="eyebrow">Subject explorer</p>
      <h2>Browse what learners can study this holiday.</h2>
    </div>
    <div class="chips">
      {#each subjects as subject}
        <a href={`/explore?subject=${encodeURIComponent(subject.toLowerCase())}`}>{subject}</a>
      {/each}
    </div>
  </section>

  <section class="page section-block">
    <div class="split-title">
      <div>
        <p class="eyebrow">Featured classes</p>
        <h2>Live classes ready for enrollment.</h2>
      </div>
      <a class="view-all" href="/explore">View all classes</a>
    </div>

    <div class="class-grid">
      {#if classes.length}
        {#each classes as item}
          <a class="class-card" href={item.href}>
            <div class="class-thumb"><Icon name="book" size={26} /></div>
            <span>{item.subject}</span>
            <h3>{item.title}</h3>
            <p>{item.teacherName}</p>
            <footer><strong>{item.price}</strong><small>Ages {item.ageGroup} • {item.enrollCount} enrolled</small></footer>
          </a>
        {/each}
      {:else}
        <article class="empty-classes">
          <h3>Featured classes will appear here once approved.</h3>
          <p>Admin-approved classes from Supabase will populate this section automatically.</p>
        </article>
      {/if}
    </div>
  </section>

  <section class="page trust-section">
    <div class="trust-copy">
      <p class="eyebrow">Trust and safety</p>
      <h2>Parents can pay and monitor with confidence.</h2>
      <ul>
        <li>All teachers verified with real certificates reviewed by admin.</li>
        <li>Children protected with AI and human content moderation.</li>
        <li>Parents monitor every class, grade and chat in real time.</li>
        <li>Pay securely with M-Pesa — no card needed.</li>
      </ul>
    </div>
    <aside class="mpesa-panel">
      <span>Kenya-first</span>
      <h3>M-Pesa payments</h3>
      <p>Pay with your phone. No card, no bank account required. Instant confirmation after checkout.</p>
    </aside>
  </section>

  <section class="page cta-band">
    <p class="eyebrow">School holiday season</p>
    <h2>This holiday, don’t waste a single day.</h2>
    <p>Enroll your child today. Classes fill up fast during school holidays.</p>
    <div>
      <a class="button" href="/register">Enroll my child</a>
      <a class="button secondary" href="/register/teacher">I want to teach</a>
    </div>
  </section>
</main>

<footer class="footer page">
  <div>
    <h3>Learnzur</h3>
    <a href="/about">About us</a>
    <a href="/how-it-works">How it works</a>
    <a href="/blog">Blog</a>
    <a href="/careers">Careers</a>
  </div>
  <div>
    <h3>For parents</h3>
    <a href="/register">Enroll a child</a>
    <a href="/help/payments">How to pay</a>
    <a href="/safety">Safety & moderation</a>
    <a href="/faq/parents">Parent FAQ</a>
  </div>
  <div>
    <h3>For teachers</h3>
    <a href="/register/teacher">Teach on Learnzur</a>
    <a href="/teachers/earnings">Earnings & payouts</a>
    <a href="/faq/teachers">Teacher FAQ</a>
    <a href="/teachers/verify">Verify my certificate</a>
  </div>
  <div>
    <h3>Support</h3>
    <a href="/help">Help center</a>
    <a href="/contact">Contact us</a>
    <a href="/privacy">Privacy policy</a>
    <a href="/terms">Terms of service</a>
  </div>
  <p>© 2025 Learnzur. Made in Kenya.</p>
</footer>

<style>
  :global(body) {
    background: #f7faf7;
  }

  .site-nav {
    position: sticky;
    top: 0;
    z-index: 50;
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 1.5rem;
    padding: 0.9rem clamp(1rem, 5vw, 4rem);
    border-bottom: 1px solid rgba(15, 23, 42, 0.08);
    background: rgba(255, 255, 255, 0.82);
    backdrop-filter: blur(20px);
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: 0.65rem;
    color: #0f172a;
    font-size: 1.15rem;
    font-weight: 900;
    letter-spacing: -0.03em;
  }

  .brand-mark {
    display: grid;
    width: 2.35rem;
    height: 2.35rem;
    place-items: center;
    border-radius: 0.85rem;
    background: linear-gradient(135deg, #0f766e, #14b8a6);
    color: white;
    box-shadow: 0 14px 30px rgba(15, 118, 110, 0.25);
  }

  .nav-links {
    display: inline-flex;
    justify-content: center;
    gap: 0.4rem;
  }

  .nav-links a,
  .login-link {
    border-radius: 999px;
    color: #334155;
    padding: 0.72rem 1rem;
    font-weight: 750;
    transition: background 0.18s ease, color 0.18s ease;
  }

  .nav-links a:hover,
  .login-link:hover {
    background: #ecfdf5;
    color: #0f766e;
  }

  .nav-actions {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
  }

  .nav-button {
    min-height: 2.45rem;
    padding-inline: 1rem;
  }

  .hamburger {
    display: none;
    width: 2.8rem;
    height: 2.8rem;
    background: white;
    border: 1px solid var(--border);
    box-shadow: var(--shadow);
  }

  .hamburger span {
    display: block;
    width: 1.1rem;
    height: 2px;
    border-radius: 999px;
    background: #0f172a;
  }

  .visit-page {
    overflow: hidden;
  }

  .hero-section {
    position: relative;
    isolation: isolate;
    min-height: 78vh;
    overflow: hidden;
  }

  .hero-bg {
    position: absolute;
    inset: 0;
    z-index: -1;
    background:
      radial-gradient(circle at 12% 22%, rgba(20, 184, 166, 0.18), transparent 24rem),
      radial-gradient(circle at 84% 12%, rgba(245, 158, 11, 0.18), transparent 22rem),
      linear-gradient(180deg, #ffffff 0%, #f2faf7 100%);
  }

  .hero-bg::after {
    content: '';
    position: absolute;
    inset: 0;
    opacity: 0.38;
    background-image:
      linear-gradient(rgba(15, 118, 110, 0.08) 1px, transparent 1px),
      linear-gradient(90deg, rgba(15, 118, 110, 0.08) 1px, transparent 1px);
    background-size: 56px 56px;
    mask-image: linear-gradient(180deg, black, transparent 72%);
  }

  .hero-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(360px, 0.85fr);
    align-items: center;
    gap: clamp(2.5rem, 7vw, 6rem);
    min-height: 78vh;
  }

  .hero-copy {
    display: grid;
    justify-items: start;
    gap: 1.3rem;
  }

  .hero-copy h1 {
    max-width: 11.5ch;
    font-size: clamp(3rem, 8vw, 6.4rem);
    line-height: 0.92;
    letter-spacing: -0.075em;
  }

  .hero-copy .lead {
    max-width: 42rem;
    font-size: clamp(1.05rem, 2vw, 1.28rem);
  }

  .hero-actions,
  .hero-trust {
    display: flex;
    flex-wrap: wrap;
    gap: 0.85rem;
  }

  .hero-primary,
  .hero-secondary {
    min-width: 11rem;
  }

  .hero-trust {
    margin-top: 0.4rem;
    color: #475569;
    font-size: 0.92rem;
    font-weight: 750;
  }

  .hero-trust span {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    border: 1px solid rgba(15, 118, 110, 0.12);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.72);
    padding: 0.55rem 0.8rem;
  }

  .hero-trust svg {
    color: #0f766e;
  }

  .hero-preview {
    position: relative;
    display: grid;
    min-height: 35rem;
    place-items: center;
  }

  .preview-card,
  .mini-card {
    border: 1px solid rgba(226, 232, 240, 0.78);
    background: rgba(255, 255, 255, 0.86);
    box-shadow: 0 28px 80px rgba(15, 23, 42, 0.14);
    backdrop-filter: blur(20px);
  }

  .main-preview {
    width: min(100%, 33rem);
    border-radius: 2rem;
    padding: 1.1rem;
  }

  .preview-toolbar {
    display: flex;
    gap: 0.45rem;
    padding: 0.3rem 0.2rem 1rem;
  }

  .preview-toolbar span {
    width: 0.72rem;
    height: 0.72rem;
    border-radius: 999px;
    background: #cbd5e1;
  }

  .preview-toolbar span:nth-child(1) { background: #fb7185; }
  .preview-toolbar span:nth-child(2) { background: #f59e0b; }
  .preview-toolbar span:nth-child(3) { background: #22c55e; }

  .preview-header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    border-radius: 1.45rem;
    background: linear-gradient(135deg, #0f172a, #0f766e);
    color: white;
    padding: 1.35rem;
  }

  .preview-header small {
    color: #99f6e4;
    font-weight: 850;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .preview-header h2 {
    margin-top: 0.2rem;
    color: white;
    font-size: clamp(1.35rem, 3vw, 2rem);
  }

  .preview-header strong {
    display: grid;
    width: 4rem;
    height: 4rem;
    place-items: center;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.12);
    color: #d1fae5;
  }

  .whiteboard-card {
    position: relative;
    min-height: 12rem;
    margin: 1rem 0;
    overflow: hidden;
    border: 1px solid #e2e8f0;
    border-radius: 1.5rem;
    background: #ffffff;
  }

  .board-line {
    position: absolute;
    left: 1.2rem;
    top: 2rem;
    width: 42%;
    height: 0.7rem;
    border-radius: 999px;
    background: #ccfbf1;
  }

  .board-line.wide {
    top: 3.4rem;
    width: 64%;
    background: #fef3c7;
  }

  .board-curve {
    position: absolute;
    right: -2rem;
    bottom: -3rem;
    width: 14rem;
    height: 14rem;
    border: 1.8rem solid rgba(20, 184, 166, 0.18);
    border-radius: 999px;
  }

  .preview-items {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.65rem;
  }

  .preview-items div {
    display: grid;
    gap: 0.4rem;
    justify-items: center;
    border-radius: 1rem;
    background: #f8fafc;
    color: #334155;
    padding: 0.85rem 0.5rem;
    text-align: center;
    font-size: 0.82rem;
    font-weight: 800;
  }

  .preview-items svg {
    color: #0f766e;
  }

  .mini-card {
    position: absolute;
    display: grid;
    gap: 0.1rem;
    border-radius: 1.2rem;
    padding: 1rem 1.1rem;
  }

  .mini-card strong {
    font-size: 1.2rem;
  }

  .mini-card span {
    color: #64748b;
    font-size: 0.82rem;
    font-weight: 700;
  }

  .attendance-card {
    left: 0;
    top: 6rem;
  }

  .mpesa-card {
    right: 0.3rem;
    bottom: 5rem;
  }

  .stats-bar {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-top: -3.2rem;
    padding-top: 0;
  }

  .stats-bar article {
    border: 1px solid rgba(226, 232, 240, 0.9);
    border-radius: 1.6rem;
    background: rgba(255, 255, 255, 0.92);
    padding: clamp(1.3rem, 3vw, 2rem);
    box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08);
    text-align: center;
  }

  .stats-bar strong {
    display: block;
    color: #0f766e;
    font-size: clamp(2rem, 5vw, 3rem);
    line-height: 1;
  }

  .stats-bar span {
    display: block;
    margin-top: 0.45rem;
    color: #475569;
    font-weight: 750;
  }

  .section-block,
  .subjects-section,
  .trust-section,
  .cta-band,
  .footer {
    margin-top: clamp(3.5rem, 8vw, 7rem);
  }

  .section-heading {
    max-width: 46rem;
    margin-bottom: 1.5rem;
  }

  .section-heading.centered {
    margin-inline: auto;
    text-align: center;
  }

  .section-heading.compact {
    margin-bottom: 1rem;
  }

  .role-grid,
  .feature-grid,
  .class-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
  }

  .role-card,
  .feature-card,
  .class-card,
  .empty-classes,
  .trust-copy,
  .mpesa-panel {
    border: 1px solid rgba(226, 232, 240, 0.88);
    background: rgba(255, 255, 255, 0.88);
    box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
  }

  .role-card {
    display: grid;
    gap: 1.3rem;
    border-radius: 1.8rem;
    padding: clamp(1.25rem, 3vw, 1.8rem);
  }

  .role-icon,
  .feature-card span,
  .safety-icon {
    display: grid;
    width: 3.2rem;
    height: 3.2rem;
    place-items: center;
    border-radius: 1.1rem;
    background: #ecfdf5;
    color: #0f766e;
  }

  .role-card p,
  .feature-card p,
  .class-card p,
  .empty-classes p,
  .trust-copy li,
  .mpesa-panel p,
  .cta-band p {
    color: #64748b;
  }

  .role-card ol {
    display: grid;
    gap: 0.75rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .role-card li {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 0.65rem;
    color: #334155;
    font-weight: 700;
  }

  .role-card li span {
    display: grid;
    width: 1.8rem;
    height: 1.8rem;
    place-items: center;
    border-radius: 999px;
    background: #0f766e;
    color: white;
    font-size: 0.78rem;
  }

  .feature-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .feature-card {
    display: grid;
    gap: 0.85rem;
    border-radius: 1.5rem;
    padding: 1.35rem;
    transition: transform 0.18s ease, box-shadow 0.18s ease;
  }

  .feature-card:hover,
  .class-card:hover,
  .role-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 22px 55px rgba(15, 23, 42, 0.1);
  }

  .subjects-section {
    border: 1px solid rgba(15, 118, 110, 0.1);
    border-radius: 2rem;
    background: linear-gradient(135deg, #ecfdf5, #ffffff 70%);
    padding: clamp(1.5rem, 4vw, 2.4rem);
  }

  .chips {
    display: flex;
    gap: 0.75rem;
    overflow-x: auto;
    padding: 0.4rem 0 0.2rem;
    scrollbar-width: thin;
  }

  .chips a {
    flex: 0 0 auto;
    border: 1px solid rgba(15, 118, 110, 0.14);
    border-radius: 999px;
    background: white;
    color: #0f766e;
    padding: 0.72rem 1rem;
    font-weight: 850;
    box-shadow: 0 8px 20px rgba(15, 118, 110, 0.06);
  }

  .split-title {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.3rem;
  }

  .view-all {
    color: #0f766e;
    font-weight: 900;
  }

  .class-card,
  .empty-classes {
    display: grid;
    gap: 0.75rem;
    border-radius: 1.7rem;
    padding: 1.25rem;
  }

  .class-thumb {
    display: grid;
    min-height: 8.5rem;
    place-items: center;
    border-radius: 1.2rem;
    background:
      radial-gradient(circle at 75% 20%, rgba(245, 158, 11, 0.22), transparent 7rem),
      linear-gradient(135deg, #0f766e, #0f172a);
    color: white;
  }

  .class-card > span {
    width: fit-content;
    border-radius: 999px;
    background: #ecfdf5;
    color: #0f766e;
    padding: 0.3rem 0.7rem;
    font-size: 0.78rem;
    font-weight: 850;
  }

  .class-card footer {
    display: grid;
    gap: 0.1rem;
    padding-top: 0.4rem;
  }

  .class-card strong {
    font-size: 1.1rem;
    color: #0f172a;
  }

  .class-card small {
    color: #64748b;
  }

  .empty-classes {
    grid-column: 1 / -1;
    padding: 2rem;
    text-align: center;
  }

  .trust-section {
    display: grid;
    grid-template-columns: 1.1fr 0.9fr;
    gap: 1rem;
  }

  .trust-copy,
  .mpesa-panel {
    border-radius: 2rem;
    padding: clamp(1.5rem, 4vw, 2.4rem);
  }

  .trust-copy ul {
    display: grid;
    gap: 0.85rem;
    margin: 1.2rem 0 0;
    padding-left: 1.2rem;
  }

  .mpesa-panel {
    display: grid;
    align-content: center;
    gap: 0.8rem;
    background:
      radial-gradient(circle at 80% 15%, rgba(245, 158, 11, 0.25), transparent 10rem),
      linear-gradient(135deg, #ecfdf5, #ffffff 60%, #fffbeb);
  }

  .mpesa-panel > span {
    width: fit-content;
    border-radius: 999px;
    background: #0f766e;
    color: white;
    padding: 0.45rem 0.8rem;
    font-size: 0.8rem;
    font-weight: 900;
  }

  .cta-band {
    display: grid;
    justify-items: center;
    gap: 1rem;
    overflow: hidden;
    border-radius: 2.4rem;
    background:
      radial-gradient(circle at 10% 20%, rgba(20, 184, 166, 0.32), transparent 20rem),
      radial-gradient(circle at 90% 10%, rgba(245, 158, 11, 0.25), transparent 18rem),
      #0f172a;
    color: white;
    padding: clamp(2rem, 6vw, 4rem);
    text-align: center;
  }

  .cta-band .eyebrow,
  .cta-band h2 {
    color: white;
  }

  .cta-band h2 {
    max-width: 12ch;
    font-size: clamp(2rem, 5vw, 4rem);
  }

  .cta-band p {
    color: #cbd5e1;
  }

  .cta-band div {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.85rem;
  }

  .footer {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1.5rem;
    border-top: 1px solid rgba(15, 23, 42, 0.08);
    padding-bottom: 2rem;
  }

  .footer h3 {
    margin-bottom: 0.7rem;
  }

  .footer a {
    display: block;
    margin: 0.45rem 0;
    color: #64748b;
    font-weight: 650;
  }

  .footer p {
    grid-column: 1 / -1;
    margin-top: 1rem;
    color: #64748b;
  }

  @media (max-width: 980px) {
    .site-nav {
      grid-template-columns: auto auto;
    }

    .hamburger {
      display: inline-grid;
      gap: 0.22rem;
      place-items: center;
      justify-self: end;
    }

    .nav-links {
      display: none;
      grid-column: 1 / -1;
      flex-direction: column;
      align-items: stretch;
      justify-content: start;
      border: 1px solid var(--border);
      border-radius: 1.2rem;
      background: white;
      padding: 0.7rem;
    }

    .nav-links.open {
      display: flex;
    }

    .nav-actions {
      display: none;
    }

    .hero-grid,
    .trust-section {
      grid-template-columns: 1fr;
    }

    .hero-grid {
      min-height: auto;
      padding-top: 4rem;
      padding-bottom: 4rem;
    }

    .hero-preview {
      min-height: 31rem;
    }

    .stats-bar,
    .role-grid,
    .feature-grid,
    .class-grid,
    .footer {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 640px) {
    .hero-copy h1 {
      max-width: 100%;
      font-size: clamp(2.7rem, 16vw, 4.5rem);
    }

    .hero-actions,
    .hero-trust,
    .cta-band div {
      width: 100%;
      flex-direction: column;
    }

    .hero-preview {
      min-height: auto;
      padding-bottom: 6rem;
    }

    .mini-card {
      position: relative;
      inset: auto;
      width: 100%;
      margin-top: 0.75rem;
    }

    .preview-items {
      grid-template-columns: 1fr;
    }

    .stats-bar {
      margin-top: 0;
    }

    .split-title {
      align-items: start;
      flex-direction: column;
    }
  }
</style>
