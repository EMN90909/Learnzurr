<script lang="ts">
  import { onMount } from 'svelte';
  import '../global.css';

  let { children } = $props();

  onMount(() => {
    async function clearOldOfflineState() {
      try {
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map((registration) => registration.unregister()));
        }
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((key) => caches.delete(key)));
        }
      } catch (error) {
        console.warn('Could not clear old Learnzur offline cache', error);
      }
    }

    clearOldOfflineState();
  });
</script>

{@render children()}
