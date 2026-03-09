<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import ModeTabs from '$lib/components/editor/ModeTabs.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import { DEFAULT_PROTECTION_RULES, type RoomPreset } from '$lib/types/generation';
  import type { ImagePlacement } from '$lib/types/image';
  import type { PresetOption } from '$lib/types/preset';

  export let projectId = '';
  export let roomImageId = '';
  export let furnitureImageId = '';
  export let stylePreset = 'original';
  export let lightPreset = 'original';
  export let roomPreset: RoomPreset = 'modern_living';
  export let variantsRequested = '1';
  export let instructions = '';
  export let projectOptions: PresetOption[] = [];
  export let roomImageOptions: PresetOption[] = [];
  export let furnitureImageOptions: PresetOption[] = [];
  export let placement: ImagePlacement | null = null;
  export let roomImageLabel = '';
  export let furnitureImageLabel = '';
  export let submitting = false;
  export let uploadingRoomPhoto = false;
  export let error = '';
  export let uploadError = '';
  export let success = '';
  export let uploadSuccess = '';

  const dispatch = createEventDispatcher<{
    modechange: 'environment_edit' | 'material_edit' | 'room_placement';
    projectchange: string;
    uploadroom: { file: File };
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
    { value: 'modern_living', label: 'Modernes Wohnzimmer' },
    { value: 'scandinavian', label: 'Skandinavisch' },
    { value: 'landhaus', label: 'Landhaus' },
    { value: 'loft', label: 'Loft / Industrial' },
    { value: 'office', label: 'Büro / Arbeitszimmer' },
    { value: 'childrens_room', label: 'Kinderzimmer' }
  ];

  let roomFile: File | null = null;

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

  const submitUpload = () => {
    if (roomFile) {
      dispatch('uploadroom', { file: roomFile });
      roomFile = null;
    }
  };

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
      <Select
        bind:value={projectId}
        id="room-project"
        label="Projekt"
        options={projectOptions}
        on:change={() => dispatch('projectchange', projectId)}
      />

      <Select
        bind:value={roomPreset}
        id="room-context"
        label="Raumkontext"
        description="Pflichtfeld für Stück platzieren."
        options={roomContextOptions}
      />

      <Select
        bind:value={roomImageId}
        id="room-image"
        label="Raumfoto"
        description="Wähle ein vorhandenes Bild oder lade unten ein neues Raumfoto hoch."
        options={roomImageOptions}
      />

      <div class="upload-field">
        <span class="field-label">Raumfoto hochladen</span>
        <input
          accept="image/*"
          type="file"
          on:change={(event) => {
            const target = event.currentTarget as HTMLInputElement;
            roomFile = target.files?.[0] ?? null;
          }}
        />
        <Button
          type="button"
          variant="secondary"
          loading={uploadingRoomPhoto}
          disabled={!projectId || !roomFile}
          on:click={submitUpload}
        >
          Raumfoto hochladen
        </Button>
      </div>

      <Select
        bind:value={furnitureImageId}
        id="room-furniture"
        label="Möbelbild"
        description="Wähle ein vorhandenes Möbelbild aus dem Projekt."
        options={furnitureImageOptions}
      />

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

      <Card accent="yellow">
        <div class="stack">
          <div class="eyebrow">Auswahlstatus</div>
          <p class="muted">Raumfoto: {roomImageLabel || 'noch nicht gewählt'}</p>
          <p class="muted">Möbelbild: {furnitureImageLabel || 'noch nicht gewählt'}</p>
          <p class="muted">
            Zielregion:
            {#if placement}
              {placement.x}, {placement.y} · {placement.width} × {placement.height}
            {:else}
              noch nicht gesetzt
            {/if}
          </p>
        </div>
      </Card>

      {#if uploadError}
        <p class="sidebar-message sidebar-message--error">{uploadError}</p>
      {/if}
      {#if uploadSuccess}
        <p class="sidebar-message sidebar-message--success">{uploadSuccess}</p>
      {/if}
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
        disabled={!projectId || !roomImageId || !furnitureImageId || !placement}
      >
        Raumvariante generieren
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
  form,
  .upload-field {
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

  .field-label {
    font-size: 0.95rem;
    font-weight: 600;
  }

  input[type='file'] {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-input);
    box-shadow: var(--color-shadow-inset);
    max-width: 100%;
    min-height: 44px;
    min-width: 0;
    padding: 10px 14px;
    width: 100%;
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
