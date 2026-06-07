<script lang="ts">
  import { forgotPassword } from '$lib/api';
  import HCaptcha from '$lib/components/HCaptcha.svelte';
  let email=''; let hcaptchaToken=''; let status=''; let loading=false;
  async function submit(){ loading=true; status=''; const res=await forgotPassword(email,hcaptchaToken); loading=false; status=res.ok ? 'If this email exists, a secure reset email has been sent.' : res.error; }
</script>
<section class="page auth-form"><h1>Forgot password</h1><p class="muted">Request a safe reset email. We never reveal whether an account exists.</p><form class="card" on:submit|preventDefault={submit}><label>Email<input bind:value={email} type="email" autocomplete="email"/></label><HCaptcha bind:token={hcaptchaToken} label="Protect password reset"/><button disabled={loading}>{loading?'Sending…':'Send reset email'}</button>{#if status}<p class="success">{status}</p>{/if}</form></section>
