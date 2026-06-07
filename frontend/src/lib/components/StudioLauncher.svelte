<script lang="ts">
  type StudioOption = {
    title: string;
    href: string;
    age: string;
    description: string;
    icon: string;
    tools: string[];
  };
  let open = false;
  const options: StudioOption[] = [
    { title: 'Animation', href: '/learner/studio/animation', age: '8-18', icon: '🎬', description: 'Make moving stories with simple presets or advanced timeline tools.', tools: ['Timeline', 'Keyframes', 'Onion skin', 'Export'] },
    { title: 'Game', href: '/learner/studio/game', age: '8-18', icon: '🎮', description: 'Build small learning games with scenes, characters, rules, and safe play tests.', tools: ['Sprites', 'Rules', 'Levels', 'Play test'] },
    { title: 'Website / App', href: '/learner/studio/website-app', age: '10-18', icon: '🌐', description: 'Create a small website or app using guided blocks, HTML, CSS, JS, or SvelteKit ideas.', tools: ['Pages', 'Buttons', 'Layout', 'Preview'] },
    { title: 'Graphic Design', href: '/learner/studio/graphic-design', age: '8-18', icon: '🎨', description: 'Ultra-light design studio for posters, cards, thumbnails, and class graphics.', tools: ['Text', 'Shapes', 'Colours', 'Export'] },
    { title: 'Beat Making', href: '/learner/studio/beat', age: '10-18', icon: '🎧', description: 'Create simple beats, preview clips, and send approved beats to Lanmat.', tools: ['BPM', 'Loops', 'Mixer', 'Lanmat'] }
  ];
</script>

<div class="studio-launcher">
  <button class="studio-plus" aria-haspopup="dialog" aria-expanded={open} on:click={() => open = true}>+<span>Studio</span></button>
  {#if open}
    <div class="studio-backdrop" role="presentation" on:click={() => open = false}></div>
    <section class="studio-modal" role="dialog" aria-modal="true" aria-labelledby="studio-title">
      <div class="studio-modal-head">
        <div><p class="eyebrow">Create something new</p><h2 id="studio-title">Choose a Studio</h2><p class="muted">Every published project becomes public in Explore after safety checks.</p></div>
        <button class="ghost" aria-label="Close studio chooser" on:click={() => open = false}>Close</button>
      </div>
      <div class="studio-option-grid">
        {#each options as option}
          <a class="studio-option" href={option.href} on:click={() => open = false}>
            <span class="studio-icon">{option.icon}</span>
            <strong>{option.title}</strong>
            <small>Ages {option.age}</small>
            <p>{option.description}</p>
            <div class="action-pills">{#each option.tools as tool}<span>{tool}</span>{/each}</div>
          </a>
        {/each}
      </div>
    </section>
  {/if}
</div>
