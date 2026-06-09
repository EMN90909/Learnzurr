<script lang="ts">
  import { onMount } from 'svelte';
  import { api } from '$lib/api';
  import { countUp, money } from '$lib/utils';
  import type { FeaturedClass, PublicStats, Subject } from '$lib/types';

  let mobileOpen = false;
  let stats: PublicStats = { activeClasses: 1240, verifiedTeachers: 380, learnersEnrolled: 14500 };
  let subjects: Subject[] = [
    'Mathematics','English','Science','Kiswahili','Physics','Chemistry','Biology','History','Geography','Coding','Art','Music'
  ].map((name) => ({ id: name.toLowerCase(), name, slug: name.toLowerCase() }));
  let classes: FeaturedClass[] = [];

  onMount(async () => {
    try { stats = await api.publicStats(); } catch {}
    try { subjects = await api.publicSubjects(); } catch {}
    try { classes = await api.featuredClasses(); } catch {}
  });

  const testimonials = [
    ['NM','Njeri M.','Parent · Nairobi','My daughter improved her maths grade from C to A in one holiday. Worth every shilling.'],
    ['JO','James O.','Teacher · Kisumu','I earned KES 42,000 last August holiday. The platform handles payments, so I can focus on teaching.'],
    ['AK','Amina K.','Learner, age 14 · Mombasa','I built my first website in the coding class and won 500 stars. I love Learnzur.']
  ];
</script>

<svelte:head><title>Learnzur — Kenya's #1 Holiday Tuition Platform</title></svelte:head>
<div class="learnzur-page page-shell">
  <div class="blob blob-1"></div><div class="blob blob-2"></div><div class="blob blob-3"></div><div class="blob blob-4"></div><div class="blob blob-5"></div>
  <nav class="navbar glass">
    <a class="brand" href="/"><span class="logo-mark">L</span><span>Learnzur</span></a>
    <button class="hamburger" aria-label="Open navigation" on:click={() => mobileOpen = !mobileOpen}><span></span><span></span><span></span></button>
    <div class:open={mobileOpen} class="nav-links">
      <a href="/explore">Explore</a><a href="/about">About</a><a href="/contact">Contact</a>
    </div>
    <div class="nav-actions"><a class="login" href="/login">Login</a><a class="btn btn-primary" href="/register">Get started</a></div>
  </nav>

  <header class="hero container">
    <div class="hero-copy">
      <span class="badge">Kenya-first holiday learning</span>
      <h1>Kenya's #1 Holiday Tuition Platform</h1>
      <p>Live online classes for ages 8–18. Expert teachers. Real results. Join thousands of Kenyan learners this holiday season.</p>
      <div class="hero-actions"><a class="btn btn-primary" href="/register">Start learning</a><a class="btn btn-secondary" href="/register/teacher">Teach on Learnzur</a></div>
    </div>
    <div class="hero-art glass" aria-label="Learnzur live class preview">
      <div class="signal-panel surface-elevated"><span>Live class</span><strong>KCPE Mathematics</strong><small>Shared board · attendance live · teacher verified</small></div>
      <div class="board-panel"><div class="equation">y = mx + b</div><div class="board-line"></div><div class="board-line short"></div><span>Interactive whiteboard</span></div>
      <div class="floating-grid"><b>50</b><span>learners per class</span><b>10</b><span>camera seats</span></div>
    </div>
  </header>

  <section class="stats-bar container glass">
    <div><strong use:countUp={stats.activeClasses}>0</strong><span>Active classes</span></div>
    <div><strong use:countUp={stats.verifiedTeachers}>0</strong><span>Verified teachers</span></div>
    <div><strong use:countUp={stats.learnersEnrolled}>0</strong><span>Learners enrolled</span></div>
  </section>

  <section class="section container">
    <div class="section-title"><span class="badge">How it works</span><h2>Simple paths for parents, teachers and learners</h2></div>
    <div class="how-grid">
      {#each [
        ['For parents',['Create account and add children','Browse and pay for classes','Monitor progress and grades']],
        ['For teachers',['Sign up and upload certificate','Create and run classes','Earn via M-Pesa payouts']],
        ['For learners',['Parent creates your account','Join live classes and submit tasks','Earn stars, badges and prizes']]
      ] as item}
        <article class="card journey"><span class="role-pill">{item[0]}</span>{#each item[1] as step, i}<p><b>{i+1}</b>{step}</p>{/each}</article>
      {/each}
    </div>
  </section>

  <section class="section container">
    <div class="section-title"><span class="badge">Platform features</span><h2>Serious learning, safe tools and modern class delivery</h2></div>
    <div class="feature-grid">
      {#each [
        ['Live classes','1 teacher, up to 50 learners, 10 cameras, shared whiteboard via WebRTC.'],
        ['Code sandbox','Write and run HTML, Python, PHP and more safely in the browser.'],
        ['Marketplace','Teachers and senior learners sell notes and books with 90% royalty to sellers.'],
        ['Gamification','Stars for juniors, points for seniors, badges, streaks and leaderboards.'],
        ['Full LMS','Quizzes, tests, assignments, grades, timetable and progress tracking.'],
        ['Contests','Web and physical contests with real prizes and sponsor support.']
      ] as feature}<article class="card feature"><div class="feature-glyph"></div><h3>{feature[0]}</h3><p>{feature[1]}</p></article>{/each}
    </div>
  </section>

  <section class="section container">
    <div class="section-title row"><div><span class="badge">Subject explorer</span><h2>Find the right class at a glance</h2></div><a class="link" href="/explore">View all</a></div>
    <div class="subject-row">{#each subjects as subject}<a class="subject-chip" href={`/explore?subject=${subject.slug}`}>{subject.name}</a>{/each}</div>
  </section>

  <section class="section container">
    <div class="section-title row"><div><span class="badge">Featured classes</span><h2>Popular this holiday</h2></div><a class="link" href="/explore">View all</a></div>
    <div class="class-grid">
      {#each (classes.length ? classes : [
        {id:'kcpe-maths', subject:'Mathematics', title:'KCPE Maths Intensive', teacherName:'Mr. Kamau', priceKes:800, ageGroup:'Ages 12–15', enrollCount:342, thumbnail:'linear-gradient(135deg,hsl(179 50% 70%),hsl(196 64% 82%))'},
        {id:'composition', subject:'English', title:'Composition & Grammar', teacherName:'Ms. Wanjiru', priceKes:600, ageGroup:'Ages 10–13', enrollCount:289, thumbnail:'linear-gradient(135deg,hsl(175 40% 60%),hsl(190 60% 85%))'},
        {id:'science-club', subject:'Science', title:'Junior Scientists Club', teacherName:'Mr. Odhiambo', priceKes:500, ageGroup:'Ages 8–12', enrollCount:198, thumbnail:'linear-gradient(135deg,hsl(185 50% 75%),hsl(170 60% 80%))'}
      ]) as c}
        <a class="card class-card" href={`/explore/class/${c.id}`}><div class="thumb" style={`background:${c.thumbnail}`}></div><span class="badge">{c.subject}</span><h3>{c.title}</h3><p>{c.teacherName} · {c.ageGroup} · {money(c.priceKes)}</p><small>{c.enrollCount}+ enrolled</small></a>
      {/each}
    </div>
  </section>

  <section class="section container testimonial-grid">{#each testimonials as t}<article class="card quote"><div class="avatar">{t[0]}</div><h3>{t[1]}</h3><p class="muted">{t[2]}</p><strong>Five star rating</strong><p>“{t[3]}”</p></article>{/each}</section>

  <section class="section container trust glass">
    <div><span class="badge">Why Kenya trusts us</span><h2>Safety, verification and parent visibility come first.</h2><ul><li>All teachers verified with real certificates reviewed by admin</li><li>Children protected through AI and human moderation</li><li>Pay securely with M-Pesa, no card needed</li><li>Parents monitor every class, grade and chat in real time</li></ul></div>
    <div class="mpesa"><b>M-Pesa payments</b><p>Pay with your phone. No card, no bank account required. Instant confirmation.</p><span>Kenya-first</span></div>
  </section>

  <section class="cta container"><h2>This holiday, do not waste a single day</h2><p>Enroll your child today. Classes fill up fast during school holidays.</p><a class="btn btn-ink" href="/register/parent">Enroll my child</a><a class="btn btn-secondary" href="/register/teacher">I want to teach</a></section>

  <footer class="footer">
    <div class="container footer-grid">{#each [['Learnzur','About us','How it works','Blog','Careers'],['For parents','Enroll a child','How to pay','Safety and moderation','Parent FAQ'],['For teachers','Teach on Learnzur','Earnings and payouts','Teacher FAQ','Verify my certificate'],['Support','Help center','Contact us','Privacy policy','Terms of service']] as col}<div><h3>{col[0]}</h3>{#each col.slice(1) as link}<a href="/about">{link}</a>{/each}</div>{/each}</div>
    <div class="bottom">© 2025 Learnzur. Made in Kenya.</div>
  </footer>
</div>

<style>
.learnzur-page{overflow:hidden}.navbar{position:sticky;top:12px;z-index:10;width:min(1180px,calc(100% - 32px));margin:12px auto 0;border-radius:999px;display:flex;align-items:center;justify-content:space-between;padding:.65rem .75rem}.brand{font-weight:950;font-size:1.18rem;display:flex;align-items:center;gap:.55rem;letter-spacing:-.04em}.logo-mark{display:grid;place-items:center;width:40px;height:40px;border-radius:16px;background:var(--gradient-primary);color:white;box-shadow:0 12px 28px hsl(179 50% 42% / .22)}.nav-links,.nav-actions{display:flex;align-items:center;gap:1rem}.nav-links a{font-weight:820;color:hsl(var(--muted-foreground))}.login{font-weight:900}.hamburger{display:none;border:0;background:hsl(var(--card));border-radius:14px;padding:.72rem;gap:.25rem;flex-direction:column}.hamburger span{width:20px;height:2px;background:hsl(var(--foreground));border-radius:999px}.hero{position:relative;display:grid;grid-template-columns:1.04fr .96fr;gap:2rem;align-items:center;padding:5.4rem 0 2.2rem}.hero-copy{animation:fade-in-up .65s ease both}.hero-copy h1{font-size:clamp(3rem,8vw,6.9rem);line-height:.9;margin:1rem 0;font-weight:1000;letter-spacing:-.075em}.hero-copy p{font-size:1.24rem;color:hsl(var(--muted-foreground));max-width:690px;line-height:1.7}.hero-actions{display:flex;gap:1rem;flex-wrap:wrap}.hero-art{position:relative;min-height:468px;border-radius:48px;padding:1.4rem;overflow:hidden;background:linear-gradient(145deg,hsl(var(--card) / .76),hsl(190 65% 95% / .72))}.hero-art:before{content:"";position:absolute;inset:8%;border-radius:50%;background:radial-gradient(circle,hsl(var(--primary) / .28),transparent 64%);filter:blur(24px)}.signal-panel,.board-panel,.floating-grid{position:relative;z-index:1}.signal-panel{width:76%;margin-left:auto;border-radius:30px;padding:1.25rem}.signal-panel span,.signal-panel small{display:block;color:hsl(var(--muted-foreground));font-weight:700}.signal-panel strong{display:block;font-size:1.8rem;letter-spacing:-.04em;margin:.25rem 0}.board-panel{margin-top:1rem;min-height:230px;border-radius:32px;background:var(--gradient-ink);color:white;padding:1.5rem;box-shadow:inset 0 0 0 2px hsl(0 0% 100% / .08)}.equation{font-size:3rem;font-weight:950;letter-spacing:-.05em}.board-line{height:10px;width:72%;border-radius:999px;background:hsl(var(--primary) / .56);margin:1.5rem 0 .8rem}.board-line.short{width:46%;background:hsl(var(--secondary) / .65);margin-top:0}.floating-grid{display:grid;grid-template-columns:80px 1fr 80px 1fr;gap:.7rem;align-items:center;margin-top:1rem}.floating-grid b{display:grid;place-items:center;height:72px;border-radius:24px;background:hsl(var(--card));font-size:1.8rem}.floating-grid span{font-weight:800;color:hsl(var(--muted-foreground))}.stats-bar{display:grid;grid-template-columns:repeat(3,1fr);border-radius:34px;padding:1.35rem;margin-top:1rem}.stats-bar div{text-align:center}.stats-bar strong{font-size:2.35rem;display:block;letter-spacing:-.06em}.stats-bar span{color:hsl(var(--muted-foreground));font-weight:820}.section{padding:4.1rem 0}.section-title h2{font-size:clamp(2rem,4vw,3.5rem);letter-spacing:-.05em;margin:.75rem 0 1.5rem;line-height:.98}.row{display:flex;justify-content:space-between;gap:1rem;align-items:end}.link{font-weight:900;color:hsl(181 42% 25%)}.how-grid,.class-grid,.testimonial-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}.feature-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}.journey{min-height:240px}.role-pill{display:inline-flex;border-radius:999px;background:hsl(var(--foreground));color:white;padding:.45rem .72rem;font-weight:900;margin-bottom:1rem}.journey p{display:flex;gap:.75rem;align-items:center;font-weight:760}.journey b{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:var(--gradient-primary);color:white}.feature{min-height:220px;position:relative;overflow:hidden}.feature:after{content:"";position:absolute;width:150px;height:150px;border-radius:50%;right:-70px;bottom:-70px;background:hsl(var(--primary) / .18)}.feature-glyph{width:48px;height:48px;border-radius:18px;background:var(--gradient-primary);box-shadow:0 16px 34px hsl(179 50% 42% / .18)}.feature p,.class-card p,.quote p{color:hsl(var(--muted-foreground));line-height:1.65}.subject-row{display:flex;gap:.75rem;overflow:auto;padding-bottom:.7rem}.subject-chip{white-space:nowrap;border-radius:999px;padding:1rem 1.2rem;background:hsl(var(--card));border:1px solid hsl(var(--border));font-weight:900;box-shadow:var(--shadow-card)}.class-card{display:block}.thumb{height:150px;border-radius:26px;margin-bottom:1rem;position:relative;overflow:hidden}.thumb:after{content:"";position:absolute;inset:18px;border-radius:20px;border:1px solid hsl(0 0% 100% / .7)}.quote .avatar{width:56px;height:56px;border-radius:21px;display:grid;place-items:center;background:var(--gradient-primary);color:white;font-weight:1000}.muted{color:hsl(var(--muted-foreground))}.trust{border-radius:44px;padding:2rem;display:grid;grid-template-columns:1.1fr .9fr;gap:1.5rem}.trust h2{font-size:2.5rem;letter-spacing:-.05em}.trust li{margin:.8rem 0;font-weight:800}.mpesa{border-radius:34px;background:var(--gradient-ink);color:white;padding:2rem;display:grid;align-content:center}.mpesa b{font-size:2rem;letter-spacing:-.04em}.mpesa span{display:inline-flex;width:max-content;border-radius:999px;background:hsl(0 0% 100% / .14);padding:.5rem .8rem;font-weight:900}.cta{margin-bottom:3rem;border-radius:46px;padding:3rem;background:var(--gradient-primary);color:white}.cta h2{font-size:clamp(2rem,5vw,4rem);letter-spacing:-.06em;margin:0}.cta p{font-size:1.2rem}.footer{background:hsl(199 30% 14%);color:white;padding:3rem 0 1rem}.footer-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:2rem}.footer a{display:block;color:hsl(0 0% 100% / .72);margin:.55rem 0}.bottom{text-align:center;color:hsl(0 0% 100% / .7);padding-top:2rem}@media(max-width:900px){.nav-links{display:none}.nav-links.open{display:flex;position:absolute;left:18px;right:18px;top:72px;flex-direction:column;background:hsl(var(--card));border-radius:24px;padding:1rem;box-shadow:var(--shadow-soft)}.nav-actions{display:none}.hamburger{display:flex}.hero,.trust{grid-template-columns:1fr}.how-grid,.feature-grid,.class-grid,.testimonial-grid,.footer-grid{grid-template-columns:1fr}.stats-bar{grid-template-columns:1fr;gap:1rem}.hero-art{min-height:370px}.signal-panel{width:100%}.floating-grid{grid-template-columns:1fr 1fr}.floating-grid span{display:none}}
</style>
