<script lang="ts">
  import * as api from '$lib/api';
  import { startSession } from '$lib/stores';
  import HCaptcha from '$lib/components/HCaptcha.svelte';
  let tab: 'adult'|'learner' = 'adult';
  let identifier=''; let password=''; let username=''; let pin=''; let error=''; let loading=false; let hcaptchaToken='';
  async function submit(){
    loading=true; error='';
    const res = tab==='adult' ? await api.login(identifier,password,hcaptchaToken) : await api.learnerLogin(username,pin,hcaptchaToken);
    loading=false;
    if(!res.ok){ error=res.error; return; }
    startSession({ ...res.data.user, accessToken: res.data.accessToken });
    location.href = res.data.user.role==='learner' ? '/learner/dashboard' : res.data.user.role==='admin' ? '/admin/dashboard' : `/${res.data.user.role}/dashboard`;
  }
</script>
<section class="page auth-form">
  <h1>Login</h1>
  <p class="muted">Secure access for parents, teachers, organizations, learners, and admins.</p>
  <div class="card">
    <div class="tabs"><button class:active={tab==='adult'} on:click={() => tab='adult'}>Parent / Teacher / Organization</button><button class:active={tab==='learner'} on:click={() => tab='learner'}>Student (Learner)</button></div>
    {#if error}<p class="error">{error}</p>{/if}
    <form on:submit|preventDefault={submit}>
      {#if tab==='adult'}
        <label>Email or phone<input bind:value={identifier} autocomplete="username" /></label>
        <label>Password<input type="password" bind:value={password} autocomplete="current-password" /></label>
      {:else}
        <label>Username or name<input bind:value={username} /></label>
        <label>6-digit PIN<input bind:value={pin} inputmode="numeric" maxlength="6" /></label>
      {/if}
      <HCaptcha bind:token={hcaptchaToken} label="Confirm this login is human" />
      <button disabled={loading}>{loading?'Checking…':'Login'}</button>
    </form>
  </div>
</section>
