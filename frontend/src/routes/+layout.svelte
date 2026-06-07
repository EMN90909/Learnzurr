<script lang="ts">
  import '../styles.css';
  import { page } from '$app/stores';
  const siteName = 'Learnzur';
  $: title = $page.data?.title ? `${$page.data.title} | ${siteName}` : 'Learnzur | Kenyan holiday tuition online';
  $: description = $page.data?.description || 'Learnzur helps Kenyan parents, teachers, and learners access holiday tuition, projects, live classes, marketplace resources, and progress tracking.';
  $: canonical = `https://learnzur.co.ke${$page.url.pathname}`;
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <meta name="robots" content="index,follow" />
  <link rel="canonical" href={canonical} />
  <meta property="og:site_name" content="Learnzur" />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={canonical} />
  <meta name="twitter:card" content="summary_large_image" />
  <script type="application/ld+json">{JSON.stringify({ '@context': 'https://schema.org', '@type': 'EducationalOrganization', name: 'Learnzur', areaServed: 'Kenya', url: canonical })}</script>
</svelte:head>

<slot />
