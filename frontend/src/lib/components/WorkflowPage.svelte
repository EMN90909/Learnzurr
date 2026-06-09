<script lang="ts">
  export let title: string;
  export let eyebrow = 'Learnzur workspace';
  export let summary: string;
  export let primaryAction = 'Continue';
  export let checkpoints: string[] = [];
  export let dataPath = '/api/health';
</script>

<section class="workflow-page">
  <div class="hero-card">
    <p class="eyebrow">{eyebrow}</p>
    <h1>{title}</h1>
    <p class="summary">{summary}</p>
    <div class="hero-actions">
      <a class="primary" href={dataPath}>{primaryAction}</a>
      <span class="api">REST source: {dataPath}</span>
    </div>
  </div>
  <div class="check-grid">
    {#each checkpoints as item, index}
      <article>
        <span>{String(index + 1).padStart(2, '0')}</span>
        <p>{item}</p>
      </article>
    {/each}
  </div>
</section>

<style>
.workflow-page{display:grid;gap:1.2rem;padding:1rem 0}.hero-card{position:relative;overflow:hidden;border:1px solid hsl(var(--border));border-radius:34px;background:linear-gradient(135deg,rgba(255,255,255,.94),rgba(255,255,255,.68));box-shadow:var(--shadow-soft);padding:clamp(1.4rem,4vw,3rem)}.hero-card:before{content:"";position:absolute;inset:auto -5rem -8rem auto;width:18rem;height:18rem;border-radius:999px;background:var(--gradient-primary);opacity:.28;filter:blur(12px)}.eyebrow{margin:0 0 .8rem;text-transform:uppercase;letter-spacing:.16em;font-size:.72rem;color:hsl(var(--muted-foreground));font-weight:800}h1{margin:0;font-size:clamp(2rem,5vw,4.8rem);line-height:.95;letter-spacing:-.06em}.summary{max-width:68ch;color:hsl(var(--muted-foreground));font-size:1.04rem;line-height:1.75}.hero-actions{display:flex;gap:1rem;align-items:center;flex-wrap:wrap}.primary{border-radius:999px;padding:.9rem 1.2rem;background:var(--gradient-ink);color:white;font-weight:900;box-shadow:var(--shadow-card)}.api{color:hsl(var(--muted-foreground));font-size:.9rem}.check-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem}.check-grid article{border:1px solid hsl(var(--border));border-radius:26px;background:rgba(255,255,255,.7);box-shadow:var(--shadow-card);padding:1.1rem}.check-grid span{display:inline-flex;width:2.2rem;height:2.2rem;align-items:center;justify-content:center;border-radius:50%;background:hsl(var(--primary)/.3);font-weight:900}.check-grid p{color:hsl(var(--muted-foreground));line-height:1.6}@media(max-width:860px){.check-grid{grid-template-columns:1fr}}
</style>
