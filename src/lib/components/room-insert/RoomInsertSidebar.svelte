<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import ModeTabs from '$lib/components/editor/ModeTabs.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import { DEFAULT_PROTECTION_RULES, type RoomPreset } from '$lib/types/generation';

  export let roomImageId = '';
  export let furnitureImageId = '';
  export let stylePreset = 'original';
  export let lightPreset = 'original';
  export let roomPreset: RoomPreset = 'none';
  export let variantsRequested = '1';
  export let instructions = '';
  export let submitting = false;
  export let error = '';
  export let success = '';

  const dispatch = createEventDispatcher<{
    modechange: 'environment_edit' | 'material_edit' | 'room_placement';
    generate: {
      roomImageId: string;
      furnitureImageId: string;
      stylePreset: string;
      lightPreset: string;
      roomPreset: RoomPreset;
      variantsRequested: number;
      userInput: string;
      instructions: string;
      preserveObject: boolean;
      preservePerspective: boolean;
      protectionRules: typeof DEFAULT_PROTECTION_RULES;
    };
    statechange: {
      roomImageId: string;
      furnitureImageId: string;
      stylePreset: string;
      lightPreset: string;
      roomPreset: RoomPreset;
      variantsRequested: number;
      userInput: string;
      instructions: string;
      preserveObject: boolean;
      preservePerspective: boolean;
      protectionRules: typeof DEFAULT_PROTECTION_RULES;
    };
  }>();

  const styleOptions = [
    { value: 'original', label: 'Original' },
    { value: 'minimal', label: 'Minimal' },
    { value: 'warm', label: 'Warm' },
    { value: 'modern', label: 'Modern' }
  ];

  const lightOptions = [
    { value: 'original', label: 'Original' },
    { value: 'warm', label: 'Warm' },
    { value: 'bright', label: 'Hell' },
    { value: 'dramatic', label: 'Dramatisch' }
  ];

  const roomContextOptions = [
    { value: 'none', label: 'Aktuell belassen' },
    { value: 'modern_living', label: 'Modernes Wohnzimmer' },
    { value: 'scandinavian', label: 'Skandinavisch' },
    { value: 'landhaus', label: 'Landhaus' },
    { value: 'loft', label: 'Loft / Industrial' },
    { value: 'office', label: 'Büro / Arbeitszimmer' },
    { value: 'childrens_room', label: 'Kinderzimmer' }
  ];
  const buildPayload = () => ({
    roomImageId,
    furnitureImageId,
    stylePreset,
    lightPreset,
    roomPreset,
    variantsRequested: Number(variantsRequested),
    userInput: instructions.trim(),
    instructions: instructions.trim(),
    preserveObject: true,
    preservePerspective: true,
    protectionRules: DEFAULT_PROTECTION_RULES
  });

  const submitGenerate = () => {
    dispatch('generate', buildPayload());
  };

  $: dispatch('statechange', buildPayload());
</script>

<div class="stack">
  <Card accent="red">
    <div class="stack room-insert__mode-stack">
      <div class="room-insert__mode-head">
        <div class="eyebrow">Modus</div>
        <h2>Stück platzieren</h2>
      </div>
      <ModeTabs
        value="room_placement"
        on:change={(event) => dispatch('modechange', event.detail)}
      />
    </div>
  </Card>

  <Card>
    <form class="stack" on:submit|preventDefault={submitGenerate}>
      <Select bind:value={roomPreset} id="room-context" label="Raum" options={roomContextOptions} />

      <Select bind:value={stylePreset} id="room-style" label="Stil" options={styleOptions} />
      <Select bind:value={lightPreset} id="room-light" label="Licht" options={lightOptions} />

      <Select
        bind:value={variantsRequested}
        id="room-variants"
        label="Varianten"
        options={[
          { value: '1', label: '1 Variante' },
          { value: '2', label: '2 Varianten' },
          { value: '3', label: '3 Varianten' },
          { value: '4', label: '4 Varianten' }
        ]}
      />

      <Input
        bind:value={instructions}
        id="room-notes"
        label="Änderungswünsche"
        multiline
        placeholder="z. B. Sofa näher ans Fenster, ruhigerer Hintergrund, weniger Dekoration"
      />
      {#if error}
        <p class="sidebar-message sidebar-message--error">{error}</p>
      {/if}
      {#if success}
        <p class="sidebar-message sidebar-message--success">{success}</p>
      {/if}

      <Button
        type="submit"
        variant="primary"
        loading={submitting}
        disabled={!roomImageId || !furnitureImageId}
      >
        Implementieren
      </Button>
    </form>
  </Card>
</div>

<style>
  h2,
  p {
    margin: 0;
  }

  h2 {
    margin-top: 6px;
  }

  .stack,
  form {
    display: grid;
    gap: 8px;
    min-width: 0;
  }

  .room-insert__mode-stack {
    gap: 16px;
  }

  .room-insert__mode-head {
    align-content: start;
    display: grid;
    min-height: 72px;
  }
  .sidebar-message {
    margin: 0;
  }

  .sidebar-message--error {
    color: var(--color-red);
  }

  .sidebar-message--success {
    color: var(--color-blue);
    font-weight: 600;
  }
</style>
