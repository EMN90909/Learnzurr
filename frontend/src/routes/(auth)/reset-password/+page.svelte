<script lang="ts">
  import { resetPassword } from '$lib/api';
  import HCaptcha from '$lib/components/HCaptcha.svelte';
  let token=''; let password=''; let confirm=''; let hcaptchaToken=''; let status=''; let error=''; let loading=false;
  async function submit(){ error=''; status=''; if(password.length<8 || password!==confirm){ error='Use matching passwords of at least 8 characters.'; return; } loading=true; const res=await resetPassword(token,password,hcaptchaToken); loading=false; if(!res.ok){ error=res.error; return;} status='Password updated. You can log in now.'; }
</script>
<section class="page auth-form"><h1>Reset password</h1><p class="muted">Enter the token from your email and set a new password.</p><form class="card" on:submit|preventDefault={submit}><label>Reset token<input bind:value={token}/></label><label>New password<input bind:value={password} type="password"/></label><label>Confirm password<input bind:value={confirm} type="password"/></label><HCaptcha bind:token={hcaptchaToken} label="Protect password reset"/>{#if error}<p class="error">{error}</p>{/if}{#if status}<p class="success">{status}</p>{/if}<button disabled={loading}>{loading?'Saving…':'Reset password'}</button></form></section>
