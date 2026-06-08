<script lang="ts">
  import { goto } from '$app/navigation';
  import { kenyaCounties } from '$lib/utils';
  import { signupParent } from '$lib/api';
  import HCaptcha from '$lib/components/HCaptcha.svelte';
  import OTPEmailCard from '$lib/components/OTPEmailCard.svelte';
  import Icon from '$lib/components/Icon.svelte';

  let step = 1;
  let email = '';
  let password = '';
  let confirmPassword = '';
  let name = '';
  let county = 'Nairobi';
  let phone = '';
  let otp = '';
  let hcaptchaToken = '';
  let error = '';
  let loading = false;

  function next() {
    error = '';
    if (step === 1 && (!email.includes('@') || password.length < 8 || password !== confirmPassword)) {
      error = 'Use a valid email and matching password of 8+ characters.';
      return;
    }
    if (step === 2 && (!name.trim() || !/^((\+254)|0)7\d{8}$/.test(phone.replace(/\s+/g, '')))) {
      error = 'Enter your name and a valid Kenyan phone number.';
      return;
    }
    step += 1;
  }

  async function submit() {
    error = '';
    if (!/^\d{6}$/.test(otp)) {
      error = 'Enter the 6-digit OTP from your email.';
      return;
    }
    loading = true;
    const res = await signupParent({ email, password, name, county, phone, otp, hcaptchaToken });
    loading = false;
    if (!res.ok) {
      error = res.error;
      return;
    }
    goto('/parent/dashboard');
  }
</script>

<section class="page auth-form" style="max-width: 520px; margin: 4rem auto; display: flex; flex-direction: column; gap: 2rem;">
  <div style="text-align: center; display: flex; flex-direction: column; gap: 0.5rem;">
    <h1 style="font-size: 2.5rem; font-weight: 900;">Parent Registration</h1>
    <p class="muted">Step {step}/3 — create your parent account, verify email, then add children from your dashboard.</p>
  </div>

  <div class="card" style="display: flex; flex-direction: column; gap: 1.5rem; padding: 2rem;">
    {#if error}
      <p class="error" style="margin: 0;">{error}</p>
    {/if}

    {#if step === 1}
      <label style="margin: 0;">
        <span>Email</span>
        <input bind:value={email} type="email" placeholder="Enter your email" required />
      </label>
      <label style="margin: 0;">
        <span>Password</span>
        <input bind:value={password} type="password" placeholder="••••••••" required />
      </label>
      <label style="margin: 0;">
        <span>Confirm password</span>
        <input bind:value={confirmPassword} type="password" placeholder="••••••••" required />
      </label>
      <HCaptcha bind:token={hcaptchaToken} label="Protect parent signup" />
      <button on:click={next} style="width: 100%; padding: 0.85rem; font-size: 1rem; font-weight: 700;">
        <span>Next</span>
        <Icon name="chevron-right" size={16} />
      </button>
    {:else if step === 2}
      <label style="margin: 0;">
        <span>Full name</span>
        <input bind:value={name} placeholder="Enter your full name" required />
      </label>
      <label style="margin: 0;">
        <span>County</span>
        <select bind:value={county}>
          {#each kenyaCounties as c}
            <option>{c}</option>
          {/each}
        </select>
      </label>
      <label style="margin: 0;">
        <span>Phone</span>
        <input bind:value={phone} inputmode="tel" placeholder="e.g. 0712345678" required />
      </label>
      <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
        <button on:click={() => step = 1} class="secondary" style="flex: 1; padding: 0.85rem;">Back</button>
        <button on:click={next} style="flex: 1; padding: 0.85rem;">Next</button>
      </div>
    {:else}
      <OTPEmailCard {email} purpose="signup" {hcaptchaToken} />
      <label style="margin: 0;">
        <span>OTP</span>
        <input bind:value={otp} maxlength="6" inputmode="numeric" placeholder="Enter 6-digit code" required />
      </label>
      <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
        <button on:click={() => step = 2} class="secondary" style="flex: 1; padding: 0.85rem;">Back</button>
        <button disabled={loading} on:click={submit} style="flex: 1; padding: 0.85rem;">
          {#if loading}
            <span>Creating…</span>
          {:else}
            <span>Create account</span>
          {/if}
        </button>
      </div>
    {/if}
  </div>
</section>