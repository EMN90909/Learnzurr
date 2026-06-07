<script lang="ts">
  export let data: { classId: string };
</script>
<section class="page hero compact">
  <p class="eyebrow">Public class preview</p>
  <h1>Learnzur class: {data.classId}</h1>
  <p class="lead">This server-rendered page is designed for SEO so parents can discover classes before signing in.</p>
  <div class="grid">
    <article class="card"><h3>What learners get</h3><p>Live lessons, quizzes, projects, feedback, progress reports, and safe class chat.</p></article>
    <article class="card"><h3>What parents see</h3><p>Fees, timetable, teacher profile, enrolment status, and child progress updates.</p></article>
    <article class="card"><h3>Teacher tools</h3><p>Assignments, tests, timetable, marketplace materials, and Mearn payment tracking.</p></article>
  </div>
</section>
