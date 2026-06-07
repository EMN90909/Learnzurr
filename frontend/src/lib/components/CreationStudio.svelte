<script lang="ts">
  import { api } from '$lib/api';
  import { sanitizeText } from '$lib/utils';
  import Toolbook from '$lib/components/Toolbook.svelte';
  import type { AgeMode, ToolGroup } from '$lib/creation/tools';
  export let kind = 'animation';
  export let heading = 'Create';
  export let lead = 'Plan, save, render, and publish safely.';
  export let toolGroups: ToolGroup[] = [];
  export let sellable = true;
  let title = '';
  let idea = '';
  let ageMode: AgeMode = '8-12';
  let mood = 'bright and calm';
  let scenes = ['Start', 'Middle', 'Ending'];
  let price = '150';
  let license = 'School project use';
  let status = 'Ready to create';
  const starterActions = ['Plan scenes', 'Add assets', 'Preview', 'Save draft', 'Render test', 'Publish publicly after review'];
  function addScene() { scenes = [...scenes, `Scene ${scenes.length + 1}`]; }
  function removeScene(index: number) { scenes = scenes.filter((_, i) => i !== index); }
  function payload() {
    return { kind, title: sanitizeText(title), idea: sanitizeText(idea), ageMode, mood, scenes, price, license };
  }
  async function saveDraft() {
    status = 'Saving draft safely...';
    const result = await api.saveMediaDraft(payload());
    status = result.ok ? 'Draft saved. You can continue later.' : result.error;
  }
  async function renderProject() {
    status = 'Sending render job to Media engine...';
    const result = await api.renderMedia(payload());
    status = result.ok ? 'Render job queued. Learnzur will notify you when it is ready.' : result.error;
  }
  async function publishToLanmat() {
    status = 'Checking content before Lanmat listing...';
    const scan = await api.scanContent(payload());
    if (!scan.ok) { status = scan.error; return; }
    const listing = await api.publishProject({ ...payload(), category: kind === 'beat' ? 'student-beats' : 'learner-creations', reviewRequired: true });
    status = listing.ok ? `${kind === 'beat' ? 'Beat' : 'Project'} sent for review. Once approved, the published project is public in Explore and sellable in Lanmat when allowed.` : listing.error;
  }
</script>

<section class="page creation-studio">
  <p class="eyebrow">Learner Studio</p>
  <h1>{heading}</h1>
  <p class="lead">{lead}</p>

  <div class="studio-grid">
    <article class="card builder-card">
      <label>Project title<input bind:value={title} maxlength="80" aria-label="Project title" /></label>
      <label>Main idea<textarea bind:value={idea} rows="4" maxlength="500" aria-label="Main idea"></textarea></label>
      <label>Age mode<select bind:value={ageMode}><option value="8-12">8-12 simple mode</option><option value="13-18">13-18 advanced mode</option></select></label>
      <label>Mood<select bind:value={mood}><option>bright and calm</option><option>funny and playful</option><option>science adventure</option><option>clean and serious</option><option>Afro-futurist</option><option>soft study beat</option></select></label>
      {#if sellable}
        <label>Lanmat price guide<input bind:value={price} inputmode="numeric" aria-label="Price in Kenya shillings" /></label>
        <label>License<select bind:value={license}><option>School project use</option><option>Personal listening/viewing</option><option>Teacher classroom use</option><option>Royalty marketplace item</option></select></label>
      {/if}
      <div class="action-pills">{#each starterActions as action}<span>{action}</span>{/each}</div>
      <div class="actions"><button on:click={saveDraft}>Save draft</button><button class="primary" on:click={renderProject}>Render test</button>{#if sellable}<button on:click={publishToLanmat}>Send to Lanmat</button>{/if}</div>
      <p class="status">{status}</p>
    </article>

    <article class="card">
      <h2>{kind === 'beat' ? 'Beat parts' : 'Scene planner'}</h2>
      <p class="muted">Use small blocks so younger learners are not overwhelmed. Older learners can rename each block with timing details.</p>
      {#each scenes as scene, index}
        <div class="scene-row"><input bind:value={scenes[index]} aria-label="Scene or beat part name" /><button on:click={() => removeScene(index)}>Remove</button></div>
      {/each}
      <button on:click={addScene}>Add {kind === 'beat' ? 'beat part' : 'scene'}</button>
    </article>
  </div>

  <Toolbook groups={toolGroups} ageMode={ageMode} title={kind === 'beat' ? 'Beat making tools' : 'Animation tools'} intro={ageMode === '8-12' ? 'Simple mode explains every tool like a toy, story, or music block.' : 'Advanced mode exposes professional controls with safer Learnzur wording.'} />
</section>
