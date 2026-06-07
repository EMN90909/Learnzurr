<script lang="ts">
  import { onDestroy, onMount } from 'svelte';

  export let siteKey = import.meta.env.PUBLIC_HCAPTCHA_SITE_KEY || '10000000-ffff-ffff-ffff-000000000001';
  export let label = 'Security check';
  export let compact = false;
  export let token = '';

  let container: HTMLDivElement;
  let widgetId: string | number | undefined;
  let ready = false;
  let skipped = false;

  declare global {
    interface Window {
      hcaptcha?: {
        render: (element: HTMLElement, options: Record<string, unknown>) => string | number;
        reset: (id?: string | number) => void;
      };
      learnzurHCaptchaReady?: () => void;
    }
  }

  function renderWidget() {
    if (!container || !window.hcaptcha || widgetId !== undefined) return;
    widgetId = window.hcaptcha.render(container, {
      sitekey: siteKey,
      size: compact ? 'compact' : 'normal',
      theme: 'light',
      callback: (value: string) => { token = value; },
      'expired-callback': () => { token = ''; },
      'error-callback': () => { token = ''; }
    });
    ready = true;
  }

  onMount(() => {
    if (!siteKey || siteKey === 'dev-disabled') { skipped = true; return; }
    window.learnzurHCaptchaReady = renderWidget;
    if (window.hcaptcha) { renderWidget(); return; }
    const existing = document.querySelector('script[data-learnzur-hcaptcha]');
    if (!existing) {
      const script = document.createElement('script');
      script.src = 'https://js.hcaptcha.com/1/api.js?render=explicit&onload=learnzurHCaptchaReady';
      script.async = true;
      script.defer = true;
      script.dataset.learnzurHcaptcha = 'true';
      document.head.appendChild(script);
    }
  });

  export function reset() {
    token = '';
    if (window.hcaptcha && widgetId !== undefined) window.hcaptcha.reset(widgetId);
  }

  onDestroy(() => {
    if (window.learnzurHCaptchaReady === renderWidget) delete window.learnzurHCaptchaReady;
  });
</script>

<div class="captcha-card" aria-live="polite">
  <div class="captcha-copy">
    <strong>{label}</strong>
    <span>Helps protect learner accounts from bots and fake signups.</span>
  </div>
  {#if skipped}
    <p class="captcha-dev">hCaptcha is disabled for this local/dev build.</p>
  {:else}
    <div bind:this={container} class="captcha-box"></div>
    {#if !ready}<small>Loading security check…</small>{/if}
  {/if}
</div>

<style>
  .captcha-card{border:1px solid rgba(15,23,42,.12);border-radius:18px;padding:1rem;background:#fffdf7;margin:1rem 0;display:grid;gap:.75rem}
  .captcha-copy{display:grid;gap:.25rem}.captcha-copy span,.captcha-card small{color:#64748b;font-size:.9rem}.captcha-box{min-height:78px}.captcha-dev{margin:0;color:#166534;background:#dcfce7;border-radius:12px;padding:.6rem .8rem}
</style>
