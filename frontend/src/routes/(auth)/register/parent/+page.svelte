<script lang="ts">
  import { goto } from '$app/navigation';
  import { kenyaCounties } from '$lib/utils';
  import { signupParent, sendOTP } from '$lib/api';
  import HCaptcha from '$lib/components/HCaptcha.svelte';
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
  let otpSending = false;
  let otpSent = false;

  function validateStepOne() {
    if (!email.includes('@')) return 'Please enter a valid email address.';
    if (password.length < 8) return 'Password must be at least 8 characters long.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    return '';
  }

  function validateStepTwo() {
    if (!name.trim()) return 'Please enter your full name.';
    if (!/^((\+254)|0)7\d{8}$/.test(phone.replace(/\s+/g, ''))) {
      return 'Please enter a valid Kenyan phone number (e.g., 0712345678).';
    }
    return '';
  }

  async function handleSendOTP() {
    error = '';
    otpSending = true;
    const res = await sendOTP(email, 'signup', hcaptchaToken);
    otpSending = false;
    if (!res.ok) {
      error = res.error;
      return;
    }
    otpSent = true;
    step = 3;
  }

  function next() {
    error = '';
    if (step === 1) {
      const err = validateStepOne();
      if (err) { error = err; return; }
      step = 2;
    } else if (step === 2) {
      const err = validateStepTwo();
      if (err) { error = err; return; }
      handleSendOTP();
    }
  }

  async function submit() {
    error = '';
    if (!/^\d{6}$/.test(otp)) {
      error = 'Please enter the 6-digit OTP sent to your email.';
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

<section class="page auth-form" style="max-width: 480px; margin: 3rem auto; display: flex; flex-direction: column; gap: 1.5rem;">
  <div style="text-align: center; display: flex; flex-direction: column; gap: 0.5rem;">
    <p class="eyebrow">Parent Portal</p>
    <h1 style="font-size: 2rem; font-weight: 800; letter-spacing: -0.02em;">Create Parent Account</h1>
    <p class="muted">Enroll children, manage tuition, and track progress.</p>
  </div>

  <!-- Progress Bar -->
  <div class="progress-container">
    <div class="progress-bar" style="width: {step === 1 ? '33%' : step === 2 ? '66%' : '100%'}"></div>
  </div>

  <div class="card" style="padding: 2rem; display: flex; flex-direction: column; gap: 1.25rem;">
    {#if error}
      <p class="error" style="margin: 0;">{error}</p>
    {/if}

    {#if step === 1}
      <div class="step-fade" style="display: flex; flex-direction: column; gap: 1.25rem;">
        <label style="margin: 0;">
          <span>Email Address</span>
          <input bind:value={email} type="email" placeholder="name@example.com" required />
        </label>
        <label style="margin: 0;">
          <span>Password</span>
          <input bind:value={password} type="password" placeholder="At least 8 characters" required />
        </label>
        <label style="margin: 0;">
          <span>Confirm Password</span>
          <input bind:value={confirmPassword} type="password" placeholder="Re-enter password" required />
        </label>
        
        <HCaptcha bind:token={hcaptchaToken} label="Security Verification" />
        
        <button on:click={next} style="width: 100%; padding: 0.8rem; font-size: 0.95rem; margin-top: 0.5rem;">
          <span>Continue</span>
          <Icon name="chevron-right" size={16} />
        </button>
      </div>
    {:else if step === 2}
      <div class="step-fade" style="display: flex; flex-direction: column; gap: 1.25rem;">
        <label style="margin: 0;">
          <span>Full Name</span>
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
          <span>Phone Number</span>
          <input bind:value={phone} inputmode="tel" placeholder="e.g. 0712345678" required />
        </label>
        
        <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
          <button on:click={() => step = 1} class="secondary" style="flex: 1; padding: 0.8rem;">Back</button>
          <button on:click={next} disabled={otpSending} style="flex: 1; padding: 0.8rem;">
            {#if otpSending}
              <span>Sending OTP…</span>
            {:else}
              <span>Verify Email</span>
            {/if}
          </button>
        </div>
      </div>
    {:else}
      <div class="step-fade" style="display: flex; flex-direction: column; gap: 1.25rem;">
        <div style="background: #f0fdfa; border: 1px solid #ccfbf1; padding: 1rem; border-radius: var(--radius-sm); text-align: center;">
          <p style="color: var(--primary); font-weight: 600; font-size: 0.95rem; margin-bottom: 0.25rem;">Verification Code Sent</p>
          <p class="muted" style="font-size: 0.85rem; margin: 0;">We sent a 6-digit code to <strong>{email}</strong></p>
        </div>

        <label style="margin: 0;">
          <span>Enter 6-Digit OTP</span>
          <input bind:value={otp} maxlength="6" inputmode="numeric" placeholder="000000" style="text-align: center; font-size: 1.5rem; letter-spacing: 0.25em; font-weight: 700;" required />
        </label>

        <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
          <button on:click={() => step = 2} class="secondary" style="flex: 1; padding: 0.8rem;">Back</button>
          <button disabled={loading} on:click={submit} style="flex: 1; padding: 0.8rem;">
            {#if loading}
              <span>Verifying…</span>
            {:else}
              <span>Complete Setup</span>
            {/if}
          </button>
        </div>
      </div>
    {/if}
  </div>

  <div style="text-align: center;">
    <p class="muted" style="font-size: 0.9rem;">Already have an account? <a href="/login" style="color: var(--primary); font-weight: 600;">Log in</a></p>
  </div>
</section>