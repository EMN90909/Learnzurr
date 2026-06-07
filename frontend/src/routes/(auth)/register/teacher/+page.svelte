<script lang="ts">
  import { goto } from '$app/navigation';
  import { api } from '$lib/api';
  import HCaptcha from '$lib/components/HCaptcha.svelte';
  import OTPEmailCard from '$lib/components/OTPEmailCard.svelte';
  import { kenyaCounties, subjects } from '$lib/utils';

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

<section class="page auth-form">
  <h1>Teacher / Organization signup</h1>
  <p class="muted">Step {step}/3 — individual teachers and learning organizations both use this approval flow.</p>

  <div class="card">
    {#if error}<p class="error">{error}</p>{/if}
    {#if success}<p class="success">{success}</p>{/if}

    {#if step === 1}
      <fieldset>
        <legend>Who is creating classes?</legend>
        <label class="choice"><input type="radio" bind:group={accountKind} value="teacher" /> Individual teacher</label>
        <label class="choice"><input type="radio" bind:group={accountKind} value="organization" /> Organization, school, tuition centre, or NGO</label>
      </fieldset>
      <label>Email<input bind:value={email} type="email" autocomplete="email" /></label>
      <label>Password<input bind:value={password} type="password" autocomplete="new-password" /></label>
      <label>Confirm password<input bind:value={confirmPassword} type="password" autocomplete="new-password" /></label>
      <HCaptcha bind:token={hcaptchaToken} label="Protect teacher / organization signup" />
      <button on:click={next}>Next</button>
    {:else if step === 2}
      {#if accountKind === 'organization'}
        <label>Organization name<input bind:value={organizationName} /></label>
        <label>Organization type<select bind:value={organizationType}>{#each organizationTypes as type}<option>{type}</option>{/each}</select></label>
        <label>Registration or authorization number<input bind:value={registrationNumber} /></label>
        <label>Contact person full name<input bind:value={name} /></label>
      {:else}
        <label>Teacher full name<input bind:value={name} /></label>
      {/if}
      <label>Phone<input bind:value={phone} inputmode="tel" /></label>
      <label>County<select bind:value={county}>{#each kenyaCounties as c}<option>{c}</option>{/each}</select></label>
      <label>{accountKind === 'organization' ? 'Registration / authorization document' : 'Certificate or teaching approval'}<input type="file" accept=".pdf,.jpg,.jpeg,.png" on:change={captureCertificate} /></label>
      {#if certificateName}<p class="muted">Selected: {certificateName}</p>{/if}

      <fieldset>
        <legend>Subjects offered</legend>
        <div class="chips">{#each subjects as subject}<button type="button" class:selected={selectedSubjects.includes(subject)} on:click={() => selectedSubjects = toggle(selectedSubjects, subject)}>{subject}</button>{/each}</div>
      </fieldset>

      <fieldset>
        <legend>Learner age groups</legend>
        <div class="chips">{#each ageGroups as group}<button type="button" class:selected={selectedAgeGroups.includes(group)} on:click={() => selectedAgeGroups = toggle(selectedAgeGroups, group)}>{group}</button>{/each}</div>
      </fieldset>

      <button on:click={() => step = 1}>Back</button>
      <button on:click={next}>Next</button>
    {:else}
      <label>M-Pesa payout phone<input bind:value={mpesa} inputmode="tel" /></label>
      <OTPEmailCard {email} purpose="signup" {hcaptchaToken}/><label>OTP<input bind:value={otp} inputmode="numeric" maxlength="6" /></label>
      <p class="muted">Learnzur reviews teachers and organizations before they can publish classes.</p>
      <button on:click={() => step = 2}>Back</button>
      <button disabled={loading} on:click={submit}>{loading ? 'Submitting…' : 'Submit for approval'}</button>
    {/if}
  </div>
</section>
