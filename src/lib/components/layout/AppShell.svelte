<script lang="ts">
  import Sidebar from '$lib/components/layout/Sidebar.svelte';
  import Topbar from '$lib/components/layout/Topbar.svelte';
</script>

<div class="shell">
  <Sidebar />

  <main class="shell__main">
    <Topbar />
    <div class="shell__content">
      <slot />
    </div>
  </main>
</div>

<style>
  .shell {
    display: grid;
    gap: var(--space-3);
    grid-template-columns: minmax(220px, var(--sidebar-width)) minmax(0, 1fr);
    margin: 0 auto;
    max-width: calc(var(--shell-width) + var(--space-6));
    min-height: 100vh;
    padding: var(--space-3);
  }

  .shell__main {
    display: grid;
    gap: var(--space-2);
    min-width: 0;
    padding: var(--space-2) 0 var(--space-4);
  }

  .shell__content {
    min-width: 0;
  }

  @media (max-width: 960px) {
    .shell {
      grid-template-columns: 1fr;
    }
  }
</style>
