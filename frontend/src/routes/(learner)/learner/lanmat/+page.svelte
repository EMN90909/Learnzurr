<script lang="ts">
  import { api } from '$lib/api';
  let title = '';
  let price = '150';
  let license = 'School project use';
  let status = 'Lanmat accepts approved notes, projects, animations, and beats.';
  async function submitBeat() {
    status = 'Sending beat listing to Flag and Lanmat review...';
    const result = await api.publishProject({ kind: 'beat', title, price, license, reviewRequired: true });
    status = result.ok ? 'Beat listing received. Parent/teacher review and marketplace checks will run before it appears.' : result.error;
  }
</script>
<svelte:head>
  <title>Lanmat Marketplace | Learnzur</title>
  <meta name="description" content="Learners can buy approved learning resources and older learners can sell reviewed beats, notes, animations, and projects through Learnzur Lanmat marketplace." />
</svelte:head>
<section class="page"><p class="eyebrow">Lanmat marketplace</p><h1>Sell and buy safe learner resources</h1><p class="lead">Lanmat supports teacher notes, learner projects, animations, code packs, and student-made beats. Seller royalties are handled through Mearn after review.</p><div class="grid"><div class="card"><h3>Beat listing</h3><label>Beat title<input bind:value={title} /></label><label>Price KSh<input bind:value={price} inputmode="numeric" /></label><label>License<select bind:value={license}><option>School project use</option><option>Personal listening</option><option>Teacher classroom use</option></select></label><button on:click={submitBeat}>Submit beat to Lanmat</button><p class="status">{status}</p></div><div class="card"><h3>Marketplace safety</h3><p class="muted">All learner listings pass through Flag scanning, parent/teacher review rules, price checks, and royalty tracking before selling.</p></div><div class="card"><h3>Create first</h3><p class="muted">Make a beat in the child-friendly studio, render a preview, then publish to Lanmat when ready.</p><a class="button" href="/learner/create/beat">Open beat maker</a></div></div></section>
