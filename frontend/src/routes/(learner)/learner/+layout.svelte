<script lang="ts">
  import StudioLauncher from '$lib/components/StudioLauncher.svelte';
  const nav = [
    'dashboard','library','studio','explore','lanmat','tasks/quizzes','tasks/tests','tasks/assignments',
    'gamfy/stars','gamfy/badges','gamfy/streaks','gamfy/leaderboard','contests','chat','meetings','notifications','settings'
  ];
  const labels: Record<string, string> = {
    studio: 'Studio +', explore: 'Explore public projects', lanmat: 'Lanmat market'
  };
</script>
<div class="layout"><aside class="sidebar"><h2>Learnzur Learner</h2>{#each nav as item}<a href={`/learner/${item}`}>{labels[item] || item}</a>{/each}</aside><main class="content"><slot /></main><StudioLauncher /></div>
