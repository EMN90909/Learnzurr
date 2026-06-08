<script lang="ts">
  import '../styles.css';
  import { page } from '$app/stores';

  const siteName = 'Learnzur';
  const siteUrl = 'https://learnzur.co.ke';
  const defaultTitle = 'Learnzur | Kenyan holiday tuition online';
  const defaultDescription = 'Learnzur helps Kenyan parents, teachers, and learners access holiday tuition, projects, live classes, marketplace resources, and progress tracking.';

  $: title = $page.data?.title ? `${$page.data.title} | ${siteName}` : defaultTitle;
  $: description = $page.data?.description || defaultDescription;
  $: canonical = `${siteUrl}${$page.url.pathname}`;
  $: structuredData = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: siteName,
    url: canonical,
    areaServed: 'Kenya',
    description,
    sameAs: [siteUrl]
  });
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <meta name="robots" content="index,follow" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#0f766e" />
  <link rel="canonical" href={canonical} />
  <meta property="og:site_name" content={siteName} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={canonical} />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <script type="application/ld+json">{structuredData}</script>
</svelte:head>

<a class="skip-link" href="#main-content">Skip to main content</a>
<div id="main-content">
  <slot />
</div>
