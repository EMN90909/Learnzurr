<script lang="ts">
  import { goto } from '$app/navigation';
  import { api } from '$lib/api';
  import HCaptcha from '$lib/components/HCaptcha.svelte';
  import OTPEmailCard from '$lib/components/OTPEmailCard.svelte';
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
  let error = '';
  let success = '';
  let hcaptchaToken = '';

  const ageGroups = ['8-12', '13-15', '16-18'];
  const organizationTypes = ['Tuition centre', 'School', 'NGO', 'Community learning group', 'Private academy'];

  function validateStepOne() {
    if (!email.includes('@')) return 'Enter a valid email address.';
    if (password.length < 8) return 'Use at least 8 characters for the password.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    return '';
  }

  function validateStepTwo() {
    if (!name.trim()) return accountKind === 'teacher' ? 'Enter the teacher full name.' : 'Enter the organization contact person.';
    if (accountKind === 'organization' && organizationName.trim().length < 2) return 'Enter the organization name.';
    if (!/^((\+254)|0)7\d{8}$/.test(phone.replace(/\s+/g, ''))) return 'Enter a valid Kenyan phone number.';
    if (!certificateName) return accountKind === 'teacher' ? 'Upload your teaching certificate or approval document.' : 'Upload an organization registration, certificate, or authorization document.';
    if (selectedSubjects.length === 0) return 'Choose at least one subject.';
    if (selectedAgeGroups.length === 0) return 'Choose at least one learner age group.';
    return '';
  }

  function next() {
    error = '';
    if (step === 1) error = validateStepOne();
    if (step === 2) error = validateStepTwo();
    if (!error) step += 1;
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
      error = 'Enter the M-Pesa phone number that will receive payouts.';
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      error = 'Enter the 6-digit OTP sent to your email.';
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
    success = accountKind === 'organization'
      ? 'Organization submitted for Learnzur admin approval. You can log in after approval.'
      : 'Teacher account submitted for Learnzur admin approval. You can log in after approval.';
    setTimeout(() => goto('/login'), 900);
  }
</script>

<section class="page auth-form" style="max-width: 560px; margin: 4rem auto; display: flex; flex-direction: column; gap: 2rem;">
  <div style="text-align: center; display: flex; flex-direction: column; gap: 0.5rem;">
    <h1 style="font-size: 2.5rem; font-weight: 900;">Teacher / Organization</h1>
    <p class="muted">Step {step}/3 — individual teachers and learning organizations both use this approval flow.</p>
  </div>

  <div class="card" style="display: flex; flex-direction: column; gap: 1.5rem; padding: 2rem;">
    {#if error}<p class="error" style="margin: 0;">{error}</p>{/if}
    {#if success}<p class="success" style="margin: 0;">{success}</p>{/if}

    {#if step === 1}
      <fieldset style="border: none; display: flex; flex-direction: column; gap: 0.5rem;">
        <legend style="font-weight: 700; margin-bottom: 0.5rem;">Who is creating classes?</legend>
        <label class="choice" style="margin: 0;">
          <input type="radio" bind:group={accountKind} value="teacher" />
          <span>Individual teacher</span>
        </label>
        <label class="choice" style="margin: 0;">
          <input type="radio" bind:group={accountKind} value="organization" />
          <span>Organization, school, tuition centre, or NGO</span>
        </label>
      </fieldset>
      <label style="margin: 0;">
        <span>Email</span>
        <input bind:value={email} type="email" autocomplete="email" placeholder="Enter your email" required />
      </label>
      <label style="margin: 0;">
        <span>Password</span>
        <input bind:value={password} type="password" autocomplete="new-password" placeholder="••••••••" required />
      </label>
      <label style="margin: 0;">
        <span>Confirm password</span>
        <input bind:value={confirmPassword} type="password" autocomplete="new-password" placeholder="••••••••" required />
      </label>
      <HCaptcha bind:token={hcaptchaToken} label="Protect teacher / organization signup" />
      <button on:click={next} style="width: 100%; padding: 0.85rem; font-size: 1rem; font-weight: 700;">
        <span>Next</span>
        <Icon name="chevron-right" size={16} />
      </button>
    {:else if step === 2}
      {#if accountKind === 'organization'}
        <label style="margin: 0;">
          <span>Organization name</span>
          <input bind:value={organizationName} placeholder="Enter organization name" required />
        </label>
        <label style="margin: 0;">
          <span>Organization type</span>
          <select bind:value={organizationType}>
            {#each organizationTypes as type}
              <option>{type}</option>
            {/each}
          </select>
        </label>
        <label style="margin: 0;">
          <span>Registration or authorization number</span>
          <input bind:value={registrationNumber} placeholder="Enter registration number" required />
        </label>
        <label style="margin: 0;">
          <span>Contact person full name</span>
          <input bind:value={name} placeholder="Enter contact person name" required />
        </label>
      {:else}
        <label style="margin: 0;">
          <span>Teacher full name</span>
          <input bind:value={name} placeholder="Enter your full name" required />
        </label>
      {/if}
      <label style="margin: 0;">
        <span>Phone</span>
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
        <span>{accountKind === 'organization' ? 'Registration / authorization document' : 'Certificate or teaching approval'}</span>
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" on:change={captureCertificate} required />
      </label>
      {#if certificateName}<p class="muted" style="font-size: 0.9rem;">Selected: {certificateName}</p>{/if}

      <fieldset style="border: none; display: flex; flex-direction: column; gap: 0.5rem;">
        <legend style="font-weight: 700; margin-bottom: 0.5rem;">Subjects offered</legend>
        <div class="chips" style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
          {#each subjects as subject}
            <button type="button" class:selected={selectedSubjects.includes(subject)} on:click={() => selectedSubjects = toggle(selectedSubjects, subject)} style="padding: 0.5rem 1rem; font-size: 0.85rem; background: {selectedSubjects.includes(subject) ? '#0f766e' : 'white'}; color: {selectedSubjects.includes(subject) ? 'white' : '#0f172a'}; border: 1px solid #e2e8f0;">
              {subject}
            </button>
          {/each}
        </div>
      </fieldset>

      <fieldset style="border: none; display: flex; flex-direction: column; gap: 0.5rem;">
        <legend style="font-weight: 700; margin-bottom: 0.5rem;">Learner age groups</legend>
        <div class="chips" style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
          {#each ageGroups as group}
            <button type="button" class:selected={selectedAgeGroups.includes(group)} on:click={() => selectedAgeGroups = toggle(selectedAgeGroups, group)} style="padding: 0.5rem 1rem; font-size: 0.85rem; background: {selectedAgeGroups.includes(group) ? '#0f766e' : 'white'}; color: {selectedAgeGroups.includes(group) ? 'white' : '#0f172a'}; border: 1px solid #e2e8f0;">
              {group}
            </button>
          {/each}
        </div>
      </fieldset>

      <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
        <button on:click={() => step = 1} class="secondary" style="flex: 1; padding: 0.85rem;">Back</button>
        <button on:click={next} style="flex: 1; padding: 0.85rem;">Next</button>
      </div>
    {:else}
      <label style="margin: 0;">
        <span>M-Pesa payout phone</span>
        <input bind:value={mpesa} inputmode="tel" placeholder="e.g. 0712345678" required />
      </label>
      <OTPEmailCard {email} purpose="signup" {hcaptchaToken} />
      <label style="margin: 0;">
        <span>OTP</span>
        <input bind:value={otp} inputmode="numeric" maxlength="6" placeholder="Enter 6-digit code" required />
      </label>
      <p class="muted" style="font-size: 0.9rem; line-height: 1.5;">Learnzur reviews teachers and organizations before they can publish classes.</p>
      <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
        <button on:click={() => step = 2} class="secondary" style="flex: 1; padding: 0.85rem;">Back</button>
        <button disabled={loading} on:click={submit} style="flex: 1; padding: 0.85rem;">
          {#if loading}
            <span>Submitting…</span>
          {:else}
            <span>Submit</span>
          {/if}
        </button>
      </div>
    {/if}
  </div>
</section>