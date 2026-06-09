<script lang="ts">
  let { children } = $props();
</script>
<div class="dashboard-layout">
  <aside class="sidebar">
    <div class="brand">Learnzur Teacher</div>
      <a href='/teacher/dashboard'>Dashboard</a>
      <a href='/teacher/profile'>Profile</a>
      <a href='/teacher/classes'>Classes</a>
      <a href='/teacher/lms/quizzes'>Lms</a>
      <a href='/teacher/lms/tests'>Lms</a>
      <a href='/teacher/lms/assignments'>Lms</a>
      <a href='/teacher/lms/grades'>Lms</a>
      <a href='/teacher/lms/progress'>Lms</a>
      <a href='/teacher/timetable'>Timetable</a>
      <a href='/teacher/classroom/demo'>Classroom</a>
      <a href='/teacher/meetings'>Meetings</a>
      <a href='/teacher/earnings'>Earnings</a>
  </aside>
  <main class="dashboard-main">
    {@render children()}
  </main>
</div>
