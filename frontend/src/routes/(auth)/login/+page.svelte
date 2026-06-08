<script lang="ts">
  import * as api from '$lib/api';
  import { startSession } from '$lib/stores';
  import HCaptcha from '$lib/components/HCaptcha.svelte';
  import Icon from '$lib/components/Icon.svelte';

  let tab: 'adult' | 'learner' = 'adult';
  let identifier = '';
  let password = '';
  let username = '';
  let pin = '';
  let error = '';
  let loading = false;
  let hcaptchaToken = '';

  async function submit() {
    loading = true;
    error = '';
    const res = tab === 'adult' 
      ? await api.login(identifier, password, hcaptchaToken) 
      : await api.learnerLogin(username, pin, hcaptchaToken);
    loading = false;
    if (!res.ok) {
      error = res.error;
      return;
    }
    startSession({ ...res.data.user, accessToken: res.data.accessToken });
    location.href = res.data.user.role === 'learner' 
      ? '/learner/dashboard' 
      : res.data.user.role === 'admin' 
        ? '/admin/dashboard' 
        : `/${res.data.user.role}/dashboard`;
  }
</script>

<section class="page auth-form" style="max-width: 480px; margin: 4rem auto; display: flex; flex-direction: column; gap: 2rem;">
  <div style="text-align: center; display: flex; flex-direction: column; gap: 0.5rem;">
    <h1 style="font-size: 2.5rem; font-weight: 900;">Welcome Back</h1>
    <p class="muted">Secure access for parents, teachers, organizations, learners, and admins.</p>
  </div>

  <div class="card" style="display: flex; flex-direction: column; gap: 1.5rem; padding: 2rem;">
    <div class="tabs" style="display: flex; width: 100%; border-bottom: 1px solid #e2e8f0; margin-bottom: 1rem;">
      <button 
        class:active={tab === 'adult'} 
        on:click={() => tab = 'adult'}
        style="flex: 1; text-align: center; padding: 0.75rem 0; font-weight: 600; border-bottom: 2px solid transparent; background: transparent; color: {tab === 'adult' ? '#0f766e' : '#64748b'}; border-bottom-color: {tab === 'adult' ? '#0f766e' : 'transparent'};"
      >
        Adult
      </button>
      <button 
        class:active={tab === 'learner'} 
        on:click={() => tab = 'learner'}
        style="flex: 1; text-align: center; padding: 0.75rem 0; font-weight: 600; border-bottom: 2px solid transparent; background: transparent; color: {tab === 'learner' ? '#0f766e' : '#64748b'}; border-bottom-color: {tab === 'learner' ? '#0f766e' : 'transparent'};"
      >
        Student
      </button>
    </div>

    {#if error}
      <p class="error" style="margin: 0;">{error}</p>
    {/if}

    <form on:submit|preventDefault={submit} style="display: flex; flex-direction: column; gap: 1.25rem;">
      {#if tab === 'adult'}
        <label style="margin: 0;">
          <span>Email or phone</span>
          <input bind:value={identifier} autocomplete="username" placeholder="Enter your email or phone" required />
        </label>
        <label style="margin: 0;">
          <span>Password</span>
          <input type="password" bind:value={password} autocomplete="current-password" placeholder="••••••••" required />
        </label>
      {:else}
        <label style="margin: 0;">
          <span>Username or name</span>
          <input bind:value={username} placeholder="Enter your username" required />
        </label>
        <label style="margin: 0;">
          <span>6-digit PIN</span>
          <input bind:value={pin} type="password" inputmode="numeric" maxlength="6" placeholder="••••••" required />
        </label>
      {/if}

      <HCaptcha bind:token={hcaptchaToken} label="Confirm this login is human" />

      <button disabled={loading} style="width: 100%; padding: 0.85rem; font-size: 1rem; font-weight: 700; margin-top: 0.5rem;">
        {#if loading}
          <span>Checking…</span>
        {:else}
          <Icon name="lock" size={18} />
          <span>Login</span>
        {/if}
      </button>
    </form>

    <div style="text-align: center; margin-top: 0.5rem;">
      <a href="/forgot-password" class="muted" style="font-size: 0.9rem; font-weight: 500; hover:color: var(--primary);">Forgot password?</a>
    </div>
  </div>

  <div style="text-align: center;">
    <p class="muted" style="font-size: 0.95rem;">Don't have an account? <a href="/register" style="color: var(--primary); font-weight: 700;">Sign up</a></p>
  </div>
</section>