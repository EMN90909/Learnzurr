<script lang="ts">
  import { goto } from '$app/navigation';
  import { api, sendOTP } from '$lib/api';
  import HCaptcha from '$lib/components/HCaptcha.svelte';
  import { kenyaCounties, subjects } from '$lib/utils';
  import Icon from '$lib/components/Icon.svelte';

  type AccountKind = 'teacher' | 'organization';

  let step = 1;
  let accountKind: AccountKind = 'teacher';
  let email = '';
  let password = '';
  let confirmPassword = '';
  let name = '';
  let organizationName = '';
  let organizationType = 'Tuition centre';
  let registrationNumber = '';
  let county = 'Nairobi';
  let phone = '';
  let mpesa = '';
  let otp = '';
  let selectedSubjects: string[] = [];
  let selectedAgeGroups: string[] = ['8-12'];
  let certificateName = '';
  let loading = false;
  let otpSending = false;
  let error = '';
  let success = '';
  let hcaptchaToken = '';

  const ageGroups = ['8-12', '13-15', '16-18'];
  const organizationTypes = ['Tuition centre', 'School', 'NGO', 'Community learning group', 'Private academy'];

  function validateStepOne() {
    if (!email.includes('@')) return 'Please enter a valid email address.';
    if (password.length < 8) return 'Password must be at least 8 characters long.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    return '';
  }

  function validateStepTwo() {
    if (!name.trim()) return accountKind === 'teacher' ? 'Please enter your full name.' : 'Please enter the contact person name.';
    if (accountKind === 'organization' && organizationName.trim().length < 2) return 'Please enter the organization name.';
    if (!/^((\+254)|0)7\d{8}$/.test(phone.replace(/\s+/g, ''))) return 'Please enter a valid Kenyan phone number.';
    if (!certificateName) return accountKind === 'teacher' ? 'Please upload your teaching certificate.' : 'Please upload your registration document.';
    if (selectedSubjects.length === 0) return 'Please select at least one subject.';
    if (selectedAgeGroups.length === 0) return 'Please select at least one age group.';
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

  function toggle(list: string[], value: string) {
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
  }

  function captureCertificate(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    certificateName = input.files?.[0]?.name || '';
  }

  async function submit() {
    error = '';
    success = '';
    if (!/^((\+254)|0)7\d{8}$/.test(mpesa.replace(/\s+/g, ''))) {
      error = 'Please enter a valid M-Pesa phone number.';
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      error = 'Please enter the 6-digit OTP sent to your email.';
      return;
    }
    loading = true;
    const payload = {
      accountType: accountKind,
      email,
      password,
      name,
      phone,
      county,
      mpesaPhone: mpesa,
      otp,
      organizationName: accountKind === 'organization' ? organizationName : '',
      organizationType: accountKind === 'organization' ? organizationType : '',
      registrationNumber: accountKind === 'organization' ? registrationNumber : '',
      subjects: selectedSubjects,
      ageGroups: selectedAgeGroups,
      certificateName,
      hcaptchaToken
    };
    const result = accountKind === 'organization' ? await api.signupOrganization(payload) : await api.signupTeacher(payload);
    loading = false;
    if (!result.ok) {
      error = result.error;
      return;
    }
    success = 'Account submitted successfully for admin approval. Redirecting to login...';
    setTimeout(() => goto('/login'), 1500);
  }
</script>

<section class="page auth-form" style="max-width: 520px; margin: 3rem auto; display: flex; flex-direction: column; gap: 1.5rem;">
  <div style="text-align: center; display: flex; flex-direction: column; gap: 0.5rem;">
    <p class="eyebrow">Educator Portal</p>
    <h1 style="font-size: 2rem; font-weight: 800; letter-spacing: -0.02em;">Teacher & Organization Signup</h1>
    <p class="muted">Join Kenya's premier holiday tuition platform.</p>
  </div>

  <!-- Progress Bar -->
  <div class="progress-container">
    <div class="progress-bar" style="width: {step === 1 ? '33%' : step === 2 ? '66%' : '100%'}"></div>
  </div>

  <div class="card" style="padding: 2rem; display: flex; flex-direction: column; gap: 1.25rem;">
    {#if error}<p class="error" style="margin: 0;">{error}</p>{/if}
    {#if success}<p class="success" style="margin: 0;">{success}</p>{/if}

    {#if step === 1}
      <div class="step-fade" style="display: flex; flex-direction: column; gap: 1.25rem;">
        <fieldset style="border: none; display: flex; flex-direction: column; gap: 0.5rem; padding: 0;">
          <legend style="font-weight: 700; font-size: 0.9rem; color: #334155; margin-bottom: 0.5rem;">Account Type</legend>
          <div style="display: flex; gap: 1rem;">
            <label class="choice" style="margin: 0; flex: 1; display: flex; flex-direction: row; align-items: center; gap: 0.5rem; padding: 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm); cursor: pointer;">
              <input type="radio" bind:group={accountKind} value="teacher" style="width: auto;" />
              <span>Individual Teacher</span>
            </label>
            <label class="choice" style="margin: 0; flex: 1; display: flex; flex-direction: row; align-items: center; gap: 0.5rem; padding: 0.75rem; border: 1px solid var(--border); border-radius: var(--radius-sm); cursor: pointer;">
              <input type="radio" bind:group={accountKind} value="organization" style="width: auto;" />
              <span>Organization</span>
            </label>
          </div>
        </fieldset>

        <label style="margin: 0;">
          <span>Email Address</span>
          <input bind:value={email} type="email" autocomplete="email" placeholder="name@example.com" required />
        </label>
        <label style="margin: 0;">
          <span>Password</span>
          <input bind:value={password} type="password" autocomplete="new-password" placeholder="At least 8 characters" required />
        </label>
        <label style="margin: 0;">
          <span>Confirm Password</span>
          <input bind:value={confirmPassword} type="password" autocomplete="new-password" placeholder="Re-enter password" required />
        </label>

        <HCaptcha bind:token={hcaptchaToken} label="Security Verification" />

        <button on:click={next} style="width: 100%; padding: 0.8rem; font-size: 0.95rem; margin-top: 0.5rem;">
          <span>Continue</span>
          <Icon name="chevron-right" size={16} />
        </button>
      </div>
    {:else if step === 2}
      <div class="step-fade" style="display: flex; flex-direction: column; gap: 1.25rem;">
        {#if accountKind === 'organization'}
          <label style="margin: 0;">
            <span>Organization Name</span>
            <input bind:value={organizationName} placeholder="e.g. Nairobi Learning Centre" required />
          </label>
          <label style="margin: 0;">
            <span>Organization Type</span>
            <select bind:value={organizationType}>
              {#each organizationTypes as type}
                <option>{type}</option>
              {/each}
            </select>
          </label>
          <label style="margin: 0;">
            <span>Registration Number</span>
            <input bind:value={registrationNumber} placeholder="e.g. REG-12345" required />
          </label>
          <label style="margin: 0;">
            <span>Contact Person Full Name</span>
            <input bind:value={name} placeholder="Enter contact person name" required />
          </label>
        {:else}
          <label style="margin: 0;">
            <span>Full Name</span>
            <input bind:value={name} placeholder="Enter your full name" required />
          </label>
        {/if}

        <label style="margin: 0;">
          <span>Phone Number</span>
          <input bind:value={phone} inputmode="tel" placeholder="e.g. 0712345678" required />
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
          <span>{accountKind === 'organization' ? 'Registration Document (PDF/Image)' : 'Teaching Certificate (PDF/Image)'}</span>
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" on:change={captureCertificate} required />
        </label>

        <fieldset style="border: none; display: flex; flex-direction: column; gap: 0.5rem; padding: 0;">
          <legend style="font-weight: 700; font-size: 0.85rem; color: #334155; margin-bottom: 0.5rem;">Subjects Offered</legend>
          <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
            {#each subjects as subject}
              <button type="button" class="secondary" on:click={() => selectedSubjects = toggle(selectedSubjects, subject)} style="padding: 0.4rem 0.8rem; font-size: 0.8rem; background: {selectedSubjects.includes(subject) ? 'var(--primary)' : 'white'}; color: {selectedSubjects.includes(subject) ? 'white' : '#334155'}; border-color: {selectedSubjects.includes(subject) ? 'var(--primary)' : 'var(--border)'};">
                {subject}
              </button>
            {/each}
          </div>
        </fieldset>

        <fieldset style="border: none; display: flex; flex-direction: column; gap: 0.5rem; padding: 0;">
          <legend style="font-weight: 700; font-size: 0.85rem; color: #334155; margin-bottom: 0.5rem;">Target Age Groups</legend>
          <div style="display: flex; gap: 0.5rem;">
            {#each ageGroups as group}
              <button type="button" class="secondary" on:click={() => selectedAgeGroups = toggle(selectedAgeGroups, group)} style="flex: 1; padding: 0.4rem 0.8rem; font-size: 0.8rem; background: {selectedAgeGroups.includes(group) ? 'var(--primary)' : 'white'}; color: {selectedAgeGroups.includes(group) ? 'white' : '#334155'}; border-color: {selectedAgeGroups.includes(group) ? 'var(--primary)' : 'var(--border)'};">
                Ages {group}
              </button>
            {/each}
          </div>
        </fieldset>

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
          <span>M-Pesa Payout Phone Number</span>
          <input bind:value={mpesa} inputmode="tel" placeholder="e.g. 0712345678" required />
        </label>

        <label style="margin: 0;">
          <span>Enter 6-Digit OTP</span>
          <input bind:value={otp} maxlength="6" inputmode="numeric" placeholder="000000" style="text-align: center; font-size: 1.5rem; letter-spacing: 0.25em; font-weight: 700;" required />
        </label>

        <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
          <button on:click={() => step = 2} class="secondary" style="flex: 1; padding: 0.8rem;">Back</button>
          <button disabled={loading} on:click={submit} style="flex: 1; padding: 0.8rem;">
            {#if loading}
              <span>Submitting…</span>
            {:else}
              <span>Submit Application</span>
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