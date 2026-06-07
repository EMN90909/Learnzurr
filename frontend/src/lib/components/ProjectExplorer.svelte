
<script lang="ts">
  import { api } from '$lib/api';
  import { exploreFilters } from '$lib/createExplore';
  export let publicMode = false;
  let status = publicMode ? 'Public Explore shows approved classes and public learning content.' : 'Learner Explore shows approved public projects from other learners.';
  let query = '';
  let selected = 'all';
  const cards = [
    { id: 'public-code-001', type: 'code', title: 'Holiday Calculator', by: 'Public learner project', note: 'HTML/CSS/JS project. Full code loads only on open.' },
    { id: 'public-animation-001', type: 'animation', title: 'Solar System Motion Story', by: 'Public learner project', note: 'Rendered by Media, moderated by Flag.' },
    { id: 'public-movie-001', type: 'movie', title: 'Science Revision Clip', by: 'Public learner project', note: 'Movie preview uses thumbnail first for phones.' },
    { id: 'public-game-001', type: 'game', title: 'Fractions Adventure', by: 'Public learner project', note: 'Game logic runs through San when opened.' }
  ];
  async function load(kind: string) {
    selected = kind;
    const result = await api.exploreProjects(kind);
    status = result.ok ? `Loaded ${kind} projects from Find. Only approved public items are shown.` : result.error;
  }
  async function search() {
    const result = await api.searchProjects(query, selected);
    status = result.ok ? `Search complete. Private drafts and unsafe projects stay hidden.` : result.error;
  }
  async function react(action: 'like'|'comment'|'report', card: { id: string; type: string }) {
    const result = action === 'like'
      ? await api.likeProject(card.type, card.id)
      : action === 'comment'
        ? await api.commentProject(card.type, card.id, 'Great project!')
        : await api.reportProject(card.type, card.id, 'Needs review');
    status = result.ok ? `${action} sent through ${card.type === 'code' || card.type === 'game' ? 'San' : 'Media'} + Flag/Gamfy safety flow.` : result.error;
  }
</script>
<div class="card explore-console">
  <h2>{publicMode ? 'Public discovery' : 'Project discovery'}</h2>
  <p>{status}</p>
  <div class="actions"><input bind:value={query} maxlength="80" aria-label="Search public projects" /><button on:click={search}>Search</button></div>
  <div class="tool-grid">{#each exploreFilters as filter}<button class:selected={selected === filter} on:click={() => load(filter)}>{filter}</button>{/each}</div>
</div>
<div class="grid">
  {#each cards as card}
    <article class="card">
      <p class="eyebrow">{card.type}</p>
      <h3>{card.title}</h3>
      <p class="muted">{card.by}</p>
      <p>{card.note}</p>
      {#if !publicMode}
        <div class="actions"><button on:click={() => react('like', card)}>Like</button><button on:click={() => react('comment', card)}>Comment</button><button on:click={() => react('report', card)}>Report</button></div>
      {/if}
    </article>
  {/each}
</div>
