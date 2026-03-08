<script lang="ts">
  import '../app.css';
  import AppShell from '$lib/components/layout/AppShell.svelte';
</script>

<svelte:head>
  <title>Tischtool</title>
  <meta
    name="description"
    content="Grundgerüst der Möbel-Visualisierungs-App mit SvelteKit und TypeScript."
  />
</svelte:head>

<AppShell>
  <slot />
</AppShell>
