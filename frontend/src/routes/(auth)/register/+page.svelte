<svelte:head><title>Get started · Learnzur</title></svelte:head>

<div class="signup-choice page-shell">
  <div class="blob blob-1"></div><div class="blob blob-2"></div>
  <main class="choice-card glass">
    <a class="badge" href="/">← Learnzur</a>
    <h1>Choose how you want to join Learnzur</h1>
    <p class="intro">Create the right account for your role. Parents enroll and monitor children. Teachers create classes, teach live, and receive payouts.</p>

    <div class="choice-grid">
      <a class="card choice" href="/register/parent">
        <span class="icon">👨‍👩‍👧</span>
        <h2>I am a parent</h2>
        <p>Add your children, browse verified holiday classes, pay with M-Pesa, and track progress from one dashboard.</p>
        <strong>Continue as parent →</strong>
      </a>

      <a class="card choice" href="/register/teacher">
        <span class="icon">👩‍🏫</span>
        <h2>I am a teacher</h2>
        <p>Submit your teaching details, create live classes, manage learners, and receive earnings after verification.</p>
        <strong>Continue as teacher →</strong>
      </a>
    </div>

    <p class="signin">Already have an account? <a href="/login">Log in</a></p>
  </main>
</div>

<style>
.signup-choice{display:grid;place-items:center;padding:3rem 0}.choice-card{width:min(980px,calc(100% - 32px));border-radius:38px;padding:clamp(1.4rem,4vw,3rem)}
h1{font-size:clamp(2.3rem,6vw,4.8rem);letter-spacing:-.07em;line-height:.95;margin:1.2rem 0 .8rem}.intro{font-size:1.15rem;line-height:1.7;color:hsl(var(--muted-foreground));max-width:760px}.choice-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem;margin-top:2rem}.choice{display:block;padding:1.6rem;transition:transform .2s ease,border-color .2s ease}.choice:hover{transform:translateY(-4px);border-color:hsl(var(--primary))}.icon{display:grid;place-items:center;width:64px;height:64px;border-radius:24px;background:hsl(var(--primary)/.16);font-size:2rem}.choice h2{font-size:1.7rem;letter-spacing:-.04em;margin:1rem 0 .5rem}.choice p{color:hsl(var(--muted-foreground));line-height:1.65}.choice strong{color:hsl(181 42% 25%)}.signin{margin-top:1.5rem;font-weight:800}.signin a{color:hsl(181 42% 25%);text-decoration:underline}@media(max-width:760px){.choice-grid{grid-template-columns:1fr}}
</style>
