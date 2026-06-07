
<script lang="ts">
  import { api } from '$lib/api';
  import { createSafetyRules, createSpeedRules } from '$lib/createExplore';
  let title = '';
  let description = '';
  let status = 'Ready';
  let output = 'Output appears here.';
  const mode = 'game';
  const languages = ['HTML', 'CSS', 'JS', 'PHP', 'SvelteKit', 'MicroPython'];
  let language = 'HTML';
  let blocks = ['Start', 'Build', 'Finish'];
  function addBlock() { blocks = [...blocks, `${mode} block ${blocks.length + 1}`]; }
  async function save() {
    const payload = { title, description, language, blocks, visibility: 'private', status: 'draft' };
    const result = mode === 'code' ? await api.saveCodeProject(payload) : mode === 'game' ? await api.saveGameProject(payload) : mode === 'animation' ? await api.saveAnimation(payload) : await api.saveMovie(payload);
    status = result.ok ? 'Saved as a private draft. It will not appear in Explore until published and approved.' : result.error;
  }
  async function runOrRender() {
    const payload = { title, language, blocks };
    const result = mode === 'code' ? await api.runCodeProject('draft', payload) : mode === 'game' ? await api.runGameProject('draft', payload) : mode === 'animation' ? await api.renderAnimation('draft', payload) : await api.renderMovie('draft', payload);
    output = result.ok ? `${mode} job accepted by the right engine.` : result.error;
  }
  async function publish() {
    const payload = { title, description, visibility: 'public', moderation: 'flag_required' };
    const result = mode === 'code' ? await api.publishCodeProject('draft', payload) : mode === 'game' ? await api.publishGameProject('draft', payload) : mode === 'animation' ? await api.publishAnimation('draft', payload) : await api.publishMovie('draft', payload);
    status = result.ok ? 'Publish request sent. If Flag approves it, the project becomes public in Explore.' : result.error;
  }
</script>
<svelte:head><title>Game Project | Learnzur Create</title><meta name="description" content="Learners create game projects using San and Media engines." /></svelte:head>
<section class="page create-page">
  <p class="eyebrow">Create</p><h1>Game Project</h1><p class="lead">Build a simple game with safe code from San and assets from Media, then publish when approved.</p>
  <div class="studio-grid">
    <article class="card">
      <label>Project title<input bind:value={title} maxlength="100" /></label>
      <label>Description<textarea bind:value={description} maxlength="500" rows="4"></textarea></label>
      <label>Language<select bind:value={language}>{#each languages as item}<option>{item}</option>{/each}</select></label>
      <h2>Game levels and rules</h2>
      {#each blocks as block, index}<div class="scene-row"><input bind:value={blocks[index]} maxlength="100" /><span>{index + 1}</span></div>{/each}
      <button on:click={addBlock}>Add block</button>
      <div class="actions"><button on:click={save}>Save draft</button><button class="primary" on:click={runOrRender}>Run game</button><button on:click={publish}>Publish safely</button></div>
      <p class="status">{status}</p><pre>{output}</pre>
    </article>
    <article class="card"><h2>Safety built in</h2>{#each createSafetyRules as rule}<p>• {rule}</p>{/each}</article>
    <article class="card"><h2>Fast on phones</h2>{#each createSpeedRules as rule}<p>• {rule}</p>{/each}</article>
  </div>
</section>
