<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from '$lib/components/Icon.svelte';

  type Stats = { activeClasses: number; verifiedTeachers: number; learnersEnrolled: number };
  type FeaturedClass = { id: string; title: string; subject: string; teacherName: string; price: string; ageGroup: string; enrollCount: number; href: string };

  let menuOpen = false;
  let stats: Stats = { activeClasses: 0, verifiedTeachers: 0, learnersEnrolled: 0 };
  let subjects = ['Mathematics','English','Science','Kiswahili','Physics','Chemistry','Biology','History','Geography','Coding','Art','Music'];
  let classes: FeaturedClass[] = [];

  const roles = [
    ['For parents', 'Create account + add children', 'Browse and pay for classes', 'Monitor progress and grades'],
    ['For teachers', 'Sign up + upload certificate', 'Create and run classes', 'Earn via M-Pesa payouts'],
    ['For learners', 'Parent creates your account', 'Join live classes + submit tasks', 'Earn stars, badges, and prizes']
  ];

  const features = [
    ['video','Live classes','1 teacher, up to 50 learners and shared whiteboard.'],
    ['activity','Code sandbox','Write and run HTML, Python, PHP and more safely in the browser.'],
    ['store','Marketplace','Teachers and senior learners sell notes and books with 90% royalty.'],
    ['trophy','Gamification','Stars, points, badges, streaks and leaderboards.'],
    ['book','Full LMS','Quizzes, tests, assignments, grades, timetable and tracking.'],
    ['award','Contests','Web and physical contests with prizes and sponsor support.']
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
  <meta name="description" content="Live online classes for ages 8–18. Expert teachers. Real results. Join thousands of Kenyan learners this holiday season." />
</svelte:head>

<nav class="site-nav">
  <a class="brand" href="/">Learnzur</a>
  <button class="hamburger" aria-label="Toggle menu" on:click={() => menuOpen = !menuOpen}>☰</button>
  <div class:open={menuOpen} class="nav-links">
    <a href="/explore">Explore</a><a href="/about">About</a><a href="/contact">Contact</a>
  </div>
  <div class="nav-actions"><a class="button secondary" href="/login">Login</a><a class="button" href="/register">Get started</a></div>
</nav>

<main class="visit-page">
  <section class="hero page">
    <p class="eyebrow">Kenya's #1 Holiday Tuition Platform</p>
    <h1>Live online classes for ages 8–18.</h1>
    <p class="lead">Expert teachers. Real results. Join thousands of Kenyan learners this holiday season through live classes, creative projects and parent-visible progress.</p>
    <div class="hero-actions"><a class="button" href="/register">Start learning</a><a class="button secondary" href="/register/teacher">Teach on Learnzur</a></div>
  </section>

  <section class="stats-bar page">
    <div><strong>{stats.activeClasses}</strong><span>Active classes</span></div>
    <div><strong>{stats.verifiedTeachers}</strong><span>Verified teachers</span></div>
    <div><strong>{stats.learnersEnrolled}</strong><span>Learners enrolled</span></div>
  </section>

  <section class="page section-block"><p class="eyebrow">How it works</p><div class="three-grid">{#each roles as role}<article class="card"><h3>{role[0]}</h3><ol><li>{role[1]}</li><li>{role[2]}</li><li>{role[3]}</li></ol></article>{/each}</div></section>

  <section class="page section-block"><p class="eyebrow">Feature highlights</p><div class="feature-grid">{#each features as item}<article class="card"><Icon name={item[0]} size={24}/><h3>{item[1]}</h3><p>{item[2]}</p></article>{/each}</div></section>

  <section class="page section-block"><p class="eyebrow">Subject explorer</p><div class="chips">{#each subjects as subject}<a href={`/explore?subject=${encodeURIComponent(subject.toLowerCase())}`}>{subject}</a>{/each}</div></section>

  <section class="page section-block"><div class="split-title"><p class="eyebrow">Featured classes</p><a href="/explore">View all →</a></div><div class="class-grid">{#if classes.length}{#each classes as item}<a class="class-card" href={item.href}><span>{item.subject}</span><h3>{item.title}</h3><p>{item.teacherName}</p><strong>{item.price}</strong><small>Ages {item.ageGroup} • {item.enrollCount} enrolled</small></a>{/each}{:else}<p class="muted">Featured classes will appear here once approved in admin.</p>{/if}</div></section>

  <section class="page trust-section"><div><p class="eyebrow">Trust and safety</p><h2>Parents can pay and monitor with confidence.</h2><ul><li>All teachers verified with real certificates reviewed by admin</li><li>Children protected by AI and human content moderation</li><li>Parents monitor every class, grade and chat in real time</li></ul></div><aside><h3>M-Pesa payments</h3><p>Pay with your phone. No card, no bank account required. Instant confirmation.</p><strong>Kenya-first</strong></aside></section>

  <section class="cta-band page"><h2>This holiday, don't waste a single day</h2><p>Enroll your child today. Classes fill up fast during school holidays.</p><div><a class="button" href="/register">Enroll my child →</a><a class="button secondary" href="/register/teacher">I want to teach</a></div></section>
</main>

<footer class="footer page"><div><h3>Learnzur</h3><a href="/about">About us</a><a href="/blog">Blog</a><a href="/careers">Careers</a></div><div><h3>For parents</h3><a href="/register">Enroll a child</a><a href="/help/payments">How to pay</a><a href="/safety">Safety & moderation</a></div><div><h3>For teachers</h3><a href="/register/teacher">Teach on Learnzur</a><a href="/teachers/earnings">Earnings & payouts</a><a href="/teachers/verify">Verify my certificate</a></div><div><h3>Support</h3><a href="/help">Help center</a><a href="/contact">Contact us</a><a href="/privacy">Privacy policy</a><a href="/terms">Terms of service</a></div><p>© 2025 Learnzur. Made in Kenya 🇰🇪</p></footer>

<style>
  .site-nav{position:sticky;top:0;z-index:50;display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.8rem clamp(1rem,4vw,3rem);background:rgba(255,255,255,.9);backdrop-filter:blur(16px);border-bottom:1px solid var(--border)}.brand{font-weight:900;font-size:1.25rem;color:var(--primary)}.nav-links,.nav-actions{display:flex;align-items:center;gap:1rem}.hamburger{display:none;width:auto;background:transparent;color:var(--text);box-shadow:none}.visit-page{overflow:hidden}.hero{text-align:center;display:grid;justify-items:center;gap:1.2rem;min-height:70vh;align-content:center;background:radial-gradient(circle at 20% 20%,rgba(15,118,110,.12),transparent 24rem)}.hero h1{max-width:900px}.hero-actions{display:flex;gap:1rem;flex-wrap:wrap;justify-content:center}.stats-bar{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-top:-2rem}.stats-bar div,.cta-band{border-radius:24px;background:#0f172a;color:white;padding:1.5rem;text-align:center}.stats-bar strong{display:block;font-size:2rem}.stats-bar span{color:#cbd5e1}.section-block{padding-top:2rem}.three-grid,.feature-grid,.class-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem;margin-top:1rem}.feature-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.feature-grid svg{color:var(--primary)}.chips{display:flex;gap:.75rem;overflow-x:auto;padding:.5rem 0}.chips a{white-space:nowrap;border:1px solid var(--border);border-radius:999px;padding:.7rem 1rem;background:white;font-weight:800}.split-title{display:flex;justify-content:space-between;align-items:center}.class-card{display:grid;gap:.45rem;border:1px solid var(--border);border-radius:24px;background:white;padding:1.4rem;box-shadow:var(--shadow)}.class-card span{width:max-content;border-radius:999px;background:var(--primary-light);color:var(--primary);padding:.25rem .65rem;font-weight:800;font-size:.78rem}.class-card small,.class-card p{color:var(--text-muted)}.trust-section{display:grid;grid-template-columns:1.2fr .8fr;gap:1rem;align-items:stretch}.trust-section>div,.trust-section aside{border-radius:28px;padding:2rem}.trust-section>div{background:white;border:1px solid var(--border)}.trust-section aside{background:linear-gradient(135deg,#f0fdfa,#fffbeb);border:1px solid rgba(15,118,110,.15)}.trust-section li{margin:.6rem 0;color:var(--text-muted)}.cta-band{margin-top:2rem;display:grid;gap:1rem}.cta-band h2{color:white;margin:auto}.cta-band div{display:flex;gap:1rem;justify-content:center;flex-wrap:wrap}.footer{display:grid;grid-template-columns:repeat(4,1fr);gap:1.5rem;border-top:1px solid var(--border)}.footer a{display:block;margin:.35rem 0;color:var(--text-muted)}.footer p{grid-column:1/-1;color:var(--text-muted)}@media(max-width:850px){.hamburger{display:inline-flex}.nav-links{display:none;position:absolute;left:1rem;right:1rem;top:4rem;flex-direction:column;background:white;border:1px solid var(--border);border-radius:18px;padding:1rem}.nav-links.open{display:flex}.nav-actions .secondary{display:none}.stats-bar,.three-grid,.feature-grid,.class-grid,.trust-section,.footer{grid-template-columns:1fr}.hero{text-align:left;justify-items:start}.hero-actions{justify-content:flex-start}}
</style>
