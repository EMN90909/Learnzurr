<script lang="ts">
  import { api } from '$lib/api';
  export let email = '';
  export let purpose: 'signup' | 'reset' | 'login' = 'signup';
  export let hcaptchaToken = '';
  let sending = false;
  let sent = false;
  let error = '';

  async function sendOtp() {
    error = '';
    if (!email.includes('@')) { error = 'Enter your email first.'; return; }
    sending = true;
    const res = await api('/auth/otp/send', { method: 'POST', body: JSON.stringify({ email, purpose, hcaptchaToken }) });
    sending = false;
    if (!res.ok) { error = res.error; return; }
    sent = true;
  }
</script>

<div class="otp-card">
  <div>
    <p class="eyebrow">Email OTP</p>
    <h3>Check your inbox for a 6-digit code</h3>
    <p>We send a clean Learnzur code email using Resend. The code expires in 10 minutes and is never shown in logs.</p>
  </div>
  <button type="button" on:click={sendOtp} disabled={sending || !email}>{sending ? 'Sending…' : sent ? 'Send again' : 'Send OTP'}</button>
  {#if sent}<p class="success">OTP sent to {email}. Open your email and type the code below.</p>{/if}
  {#if error}<p class="error">{error}</p>{/if}
</div>

<style>
  .otp-card{display:grid;gap:.75rem;padding:1rem;border:1px solid rgba(12,139,92,.22);background:linear-gradient(135deg,#ecfdf5,#fff7ed);border-radius:20px;margin:1rem 0}.otp-card h3{margin:.15rem 0}.otp-card p{margin:0;color:#475569}.eyebrow{font-size:.78rem;text-transform:uppercase;letter-spacing:.08em;color:#047857!important;font-weight:800}.success{color:#047857!important}.error{color:#b91c1c!important}.otp-card button{width:max-content}
</style>
