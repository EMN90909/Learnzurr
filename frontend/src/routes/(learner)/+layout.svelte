<script lang="ts">
  let { children } = $props();
</script>
<div class="dashboard-layout">
  <aside class="sidebar">
    <div class="brand">Learnzur Learner</div>
      <a href='/learner/dashboard'>Dashboard</a>
      <a href='/learner/library'>Library</a>
      <a href='/learner/classroom/demo'>Classroom</a>
      <a href='/learner/tasks/quizzes'>Tasks</a>
      <a href='/learner/tasks/tests'>Tasks</a>
      <a href='/learner/tasks/assignments'>Tasks</a>
      <a href='/learner/create/code'>Create</a>
      <a href='/learner/create/animate'>Create</a>
      <a href='/learner/create/movie'>Create</a>
      <a href='/learner/create/game'>Create</a>
      <a href='/learner/explore'>Explore</a>
      <a href='/learner/lanmat'>Lanmat</a>
  </aside>
  <main class="dashboard-main">
    {@render children()}
  </main>
</div>
