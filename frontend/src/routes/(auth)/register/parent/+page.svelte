<script lang="ts">
  let fullName = '';
  let email = '';
  let phone = '';
  let childName = '';
  let childAge = '';
  let password = '';
  let busy = false;
  let message = '';

  function submit() {
    busy = true;
    message = 'Parent account details saved. Email verification will be sent when production email is connected.';
  }
</script>

<svelte:head><title>Parent signup · Learnzur</title></svelte:head>

<div class="form-wrap page-shell">
  <div class="blob blob-1"></div><div class="blob blob-2"></div>
  <form class="form-card glass" on:submit|preventDefault={submit}>
    <a class="badge" href="/register">← Choose account type</a>
    <h1>Create a parent account</h1>
    <p>Use this account to enroll your child, pay with M-Pesa, monitor classes, and receive progress updates.</p>

    <div class="field"><label for="fullName">Parent full name</label><input id="fullName" bind:value={fullName} autocomplete="name" required /></div>
    <div class="field"><label for="email">Email address</label><input id="email" type="email" bind:value={email} autocomplete="email" required /></div>
    <div class="field"><label for="phone">M-Pesa phone number</label><input id="phone" bind:value={phone} autocomplete="tel" placeholder="07xx xxx xxx" required /></div>
    <div class="field"><label for="childName">Child name</label><input id="childName" bind:value={childName} required /></div>
    <div class="field"><label for="childAge">Child age</label><input id="childAge" bind:value={childAge} inputmode="numeric" required /></div>
    <div class="field"><label for="password">Create password</label><input id="password" bind:value={password} type="password" autocomplete="new-password" required /></div>

    <button class="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Creating account…' : 'Create parent account'}</button>
    {#if message}<p class="success">{message}</p>{/if}
  </form>
</div>

<style>
.form-card h1{font-size:clamp(2rem,5vw,3.6rem);letter-spacing:-.06em;margin:1rem 0 .5rem}.form-card p{color:hsl(var(--muted-foreground));line-height:1.7}.field{display:grid;gap:.45rem;margin:1rem 0}.field label{font-weight:850}.field input{width:100%;border:1px solid hsl(var(--border));border-radius:18px;padding:.95rem 1rem;background:hsl(var(--card));outline:none}.field input:focus{box-shadow:var(--shadow-focus);border-color:hsl(var(--primary))}.success{color:hsl(150 60% 28%);font-weight:850}.btn[disabled]{opacity:.65;cursor:not-allowed}
</style>
