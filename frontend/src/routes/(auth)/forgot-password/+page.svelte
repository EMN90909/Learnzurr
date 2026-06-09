<script lang="ts">
  import { api } from '$lib/api';

  let email = '';
  let otp = '';
  let newPassword = '';
  let confirmPassword = '';
  let step: 'email' | 'otp' | 'done' = 'email';
  let busy = false;
  let message = '';
  let error = '';

  async function requestOtp() {
    error = '';
    message = '';
    if (!email.trim()) {
      error = 'Enter the email connected to your Learnzur account.';
      return;
    }
    busy = true;
    try {
      await api.forgotPassword(email.trim());
      step = 'otp';
      message = `We sent a verification code to ${email.trim()}.`;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Could not send the verification code. Try again.';
    } finally {
      busy = false;
    }
  }

  async function verifyOtp() {
    error = '';
    message = '';
    if (!otp.trim()) {
      error = 'Enter the OTP sent to your email.';
      return;
    }
    if (newPassword.length < 8) {
      error = 'Use at least 8 characters for the new password.';
      return;
    }
    if (newPassword !== confirmPassword) {
      error = 'The two passwords do not match.';
      return;
    }
    busy = true;
    try {
      await api.resetPassword(email.trim(), otp.trim(), newPassword);
      step = 'done';
      message = 'Your password has been reset. You can now log in.';
    } catch (err) {
      error = err instanceof Error ? err.message : 'The OTP could not be verified. Check the code and try again.';
    } finally {
      busy = false;
    }
  }
</script>

<svelte:head><title>Reset password · Learnzur</title></svelte:head>

<div class="form-wrap page-shell">
  <div class="blob blob-1"></div><div class="blob blob-2"></div>
  <section class="form-card glass">
    <a class="badge" href="/login">← Back to login</a>
    <h1>Reset your password</h1>

    {#if step === 'email'}
      <p>Enter your account email. We will send a one-time verification code to confirm it is you.</p>
      <form on:submit|preventDefault={requestOtp}>
        <div class="field"><label for="email">Email address</label><input id="email" type="email" bind:value={email} autocomplete="email" placeholder="you@example.com" /></div>
        <button class="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Sending OTP…' : 'Send OTP verification'}</button>
      </form>
    {:else if step === 'otp'}
      <p>{message}</p>
      <form on:submit|preventDefault={verifyOtp}>
        <div class="field"><label for="otp">OTP verification code</label><input id="otp" bind:value={otp} inputmode="numeric" autocomplete="one-time-code" placeholder="6-digit code" /></div>
        <div class="field"><label for="new-password">New password</label><input id="new-password" type="password" bind:value={newPassword} autocomplete="new-password" /></div>
        <div class="field"><label for="confirm-password">Confirm new password</label><input id="confirm-password" type="password" bind:value={confirmPassword} autocomplete="new-password" /></div>
        <button class="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Verifying…' : 'Verify OTP and reset password'}</button>
        <button class="link-button" type="button" on:click={requestOtp} disabled={busy}>Resend OTP</button>
      </form>
    {:else}
      <p class="success">{message}</p>
      <a class="btn btn-primary" href="/login">Go to login</a>
    {/if}

    {#if error}<p class="error">{error}</p>{/if}
  </section>
</div>

<style>
.form-card h1{font-size:clamp(2rem,5vw,3.6rem);letter-spacing:-.06em;margin:1rem 0 .5rem}.form-card p{color:hsl(var(--muted-foreground));line-height:1.7}.field{display:grid;gap:.45rem;margin:1rem 0}.field label{font-weight:850}.field input{width:100%;border:1px solid hsl(var(--border));border-radius:18px;padding:.95rem 1rem;background:hsl(var(--card));outline:none}.field input:focus{box-shadow:var(--shadow-focus);border-color:hsl(var(--primary))}.error{color:hsl(var(--destructive));font-weight:800}.success{color:hsl(150 60% 28%);font-weight:850}.link-button{border:0;background:transparent;color:hsl(181 42% 25%);font-weight:850;margin-left:.75rem}.btn[disabled],.link-button[disabled]{opacity:.65;cursor:not-allowed}
</style>
