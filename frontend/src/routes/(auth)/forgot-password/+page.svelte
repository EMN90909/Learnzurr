<script lang="ts">
  let email = '';
  let password = '';
  let busy = false;
</script>
<svelte:head><title>Forgot Password</title></svelte:head>
<div class="form-wrap page-shell">
  <div class="blob blob-1"></div><div class="blob blob-2"></div>
  <form class="form-card glass" on:submit|preventDefault={() => busy = true}>
    <span class="badge">Secure account access</span>
    <h1>Forgot Password</h1>
    <p>Use the details connected to your Learnzur profile. Parent, teacher and learner accounts are routed after authentication.</p>
    <div class="field"><label for="email">Email or phone</label><input id="email" bind:value={email} autocomplete="email" /></div>
    <div class="field"><label for="password">Password or PIN</label><input id="password" bind:value={password} type="password" autocomplete="current-password" /></div>
    <button class="btn btn-primary" type="submit">{busy ? 'Checking account' : 'Continue'}</button>
    <a class="small-link" href="/forgot-password">Forgot password?</a>
  </form>
</div>
<style>
.form-card h1{font-size:clamp(2rem,5vw,3.6rem);letter-spacing:-.06em;margin:1rem 0 .5rem}.form-card p{color:hsl(var(--muted-foreground));line-height:1.7}.small-link{display:inline-block;margin-top:1rem;color:hsl(181 42% 25%);font-weight:850}
</style>
