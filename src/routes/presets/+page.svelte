<script lang="ts">
  import Card from '$lib/components/ui/Card.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import PresetSelect from '$lib/components/presets/PresetSelect.svelte';
  import Button from '$lib/components/ui/Button.svelte';

  let stylePreset = 'editorial';
  let lightPreset = 'tageslicht';
  let presetName = 'Wohnlich Tageslicht';
</script>

<div class="stack page-body--flush">
  <Card accent="yellow">
    <div class="stack">
      <Input bind:value={presetName} id="preset-name" label="Preset-Name" />
      <PresetSelect
        bind:value={stylePreset}
        id="preset-style"
        label="Stil-Preset"
        description="Empfohlene Seed-Werte aus 21_ENV_AND_SETUP.md."
      />
      <PresetSelect bind:value={lightPreset} id="preset-light" label="Licht-Preset" />
      <div class="cluster">
        <Button variant="primary" disabled>Preset speichern</Button>
        <Button disabled>Reset</Button>
      </div>
    </div>
  </Card>
</div>
