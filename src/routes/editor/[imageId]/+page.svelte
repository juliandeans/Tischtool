<script lang="ts">
  import EditorCanvas from '$lib/components/editor/EditorCanvas.svelte';
  import EditorSidebar from '$lib/components/editor/EditorSidebar.svelte';

  export let data;
</script>

<div class="page-header">
  <span class="eyebrow">Editor</span>
  <h1>Einzelbild-Editor</h1>
  <p>
    Bildfläche und rechte Sidebar sind angelegt. Prompt-Aufbau, Variantenlogik und echte Generierung
    bleiben in späteren Phasen.
  </p>
</div>

<div class="split-layout">
  <EditorCanvas imageId={data.imageId} />
  <EditorSidebar />
</div>
