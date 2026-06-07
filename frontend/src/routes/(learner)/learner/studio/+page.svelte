<script lang="ts">
  import StudioLauncher from '$lib/components/StudioLauncher.svelte';
  const studioTypes = [
    ['Animation', '/learner/studio/animation', 'Make moving stories with frames, characters, audio, and exports.'],
    ['Game', '/learner/studio/game', 'Make a simple playable learning game with levels and rules.'],
    ['Website / App', '/learner/studio/website-app', 'Build a small web page or app using guided blocks.'],
    ['Graphic Design', '/learner/studio/graphic-design', 'Create posters, cards, thumbnails, and class graphics without heavy tools.'],
    ['Beat Making', '/learner/studio/beat', 'Create loops, melodies, and preview clips that can be sold on Lanmat after review.']
  ];
</script>
<svelte:head>
  <title>Studio | Learnzur</title>
  <meta name="description" content="Learnzur Studio lets learners create animations, games, websites, apps, graphic designs, and beats, then publish public projects to Explore after review." />
</svelte:head>
<section class="page">
  <p class="eyebrow">Studio</p>
  <h1>Create with the + button</h1>
  <p class="lead">Studio is the new Create area. Learners start from the add button, choose a project type, build safely, then publish. Published projects are public and appear in Explore.</p>
  <div class="grid">{#each studioTypes as item}<article class="card"><h2>{item[0]}</h2><p class="muted">{item[2]}</p><a class="button" href={item[1]}>Open {item[0]}</a></article>{/each}</div>
  <StudioLauncher />
</section>
