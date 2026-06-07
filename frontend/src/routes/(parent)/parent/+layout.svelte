<script lang="ts">const nav=['dashboard','children','classes','payments/enroll','payments/lanmat','payments/history','results','messages','chat-monitor','notifications','settings'];</script>
<div class="layout"><aside class="sidebar"><h2>Learnzur Parent</h2>{#each nav as item}<a href={`/parent/${item}`}>{item}</a>{/each}</aside><main class="content"><slot /></main></div>
