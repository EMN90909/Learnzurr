<script lang="ts">
  import type { AgeMode, ToolGroup } from '$lib/creation/tools';
  export let groups: ToolGroup[] = [];
  export let ageMode: AgeMode = '8-12';
  export let title = 'Creation tools';
  export let intro = 'Choose a group to understand each tool.';
  let openGroup = groups[0]?.id || '';
  $: visibleGroups = ageMode === '8-12'
    ? groups.map((group) => ({ ...group, tools: group.tools, learnerBenefit: group.level === 'advanced' ? `${group.learnerBenefit} Learnzur shows this as guided buttons first, then advanced controls when the learner is ready.` : group.learnerBenefit }))
    : groups;
  $: activeGroup = visibleGroups.find((group) => group.id === openGroup) || visibleGroups[0];
  $: if (visibleGroups.length && !visibleGroups.some((group) => group.id === openGroup)) openGroup = visibleGroups[0].id;
</script>

<section class="card toolbook" aria-label={title}>
  <div class="toolbook-head">
    <div>
      <p class="eyebrow">Age mode: {ageMode}</p>
      <h2>{title}</h2>
      <p class="muted">{intro}</p>
    </div>
    <p class="tool-count">{visibleGroups.reduce((total, group) => total + group.tools.length, 0)} tools</p>
  </div>
  <div class="toolbook-grid">
    <nav class="tool-tabs" aria-label="Tool groups">
      {#each visibleGroups as group}
        <button class:selected={openGroup === group.id} on:click={() => openGroup = group.id}>
          <span>{group.friendlyName}</span>
          <small>{group.tools.length} tools · {group.level === 'simple' ? 'starter' : 'guided advanced'}</small>
        </button>
      {/each}
    </nav>
    {#if activeGroup}
      <article class="tool-details">
        <h3>{activeGroup.title}</h3>
        <p class="muted">{activeGroup.learnerBenefit}</p>
        <div class="mini-grid">
          {#each activeGroup.tools as tool}
            <div class="mini-card">
              <h4>{tool.name}</h4>
              <p>{ageMode === '8-12' ? tool.simple : tool.advanced}</p>
              {#if ageMode === '8-12' && activeGroup.level === 'advanced'}
                <small>Shown as a safe preset first. Advanced sliders stay hidden until the learner chooses “more control”.</small>
              {:else if ageMode === '13-18'}
                <small>Advanced mode keeps precise controls visible and still sends risky actions through safety checks.</small>
              {/if}
            </div>
          {/each}
        </div>
      </article>
    {/if}
  </div>
</section>
