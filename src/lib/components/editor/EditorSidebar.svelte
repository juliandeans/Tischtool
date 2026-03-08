<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import ModeTabs from '$lib/components/editor/ModeTabs.svelte';

  const styleOptions = [
    { value: 'original', label: 'Original' },
    { value: 'editorial', label: 'Editorial' },
    { value: 'wohnlich', label: 'Wohnlich' }
  ];

  const lightOptions = [
    { value: 'original', label: 'Original' },
    { value: 'tageslicht', label: 'Tageslicht' },
    { value: 'abendlicht', label: 'Abendlicht' }
  ];

  let style = 'original';
  let light = 'original';
  let variants = '2';
  let notes = '';
</script>

<div class="stack">
  <Card accent="blue">
    <div class="stack">
      <div>
        <div class="eyebrow">Mode</div>
        <h2>Editor Controls</h2>
      </div>
      <ModeTabs />
    </div>
  </Card>

  <Card>
    <div class="stack">
      <Select
        bind:value={style}
        id="editor-style"
        label="Stil"
        description="Seed-Werte aus dem Setup-Dokument."
        options={styleOptions}
      />
      <Select bind:value={light} id="editor-light" label="Licht" options={lightOptions} />
      <Select
        bind:value={variants}
        id="editor-variants"
        label="Varianten"
        options={[
          { value: '1', label: '1 Variante' },
          { value: '2', label: '2 Varianten' },
          { value: '3', label: '3 Varianten' }
        ]}
      />
      <Input
        bind:value={notes}
        id="editor-notes"
        label="Zusätzliche Hinweise"
        placeholder="Noch ohne Prompt- oder Generate-Logik"
      />
      <Button variant="primary" disabled>Generate kommt später</Button>
    </div>
  </Card>
</div>

<style>
  h2 {
    margin: 6px 0 0;
  }
</style>
