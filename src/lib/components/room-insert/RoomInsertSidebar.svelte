<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Select from '$lib/components/ui/Select.svelte';

  let furniture = 'placeholder-chair';
  let style = 'original';
  let light = 'original';
  let variants = '2';
</script>

<div class="stack">
  <Card accent="red">
    <div class="stack">
      <div class="eyebrow">Room Insert</div>
      <h2>Platzierungs-Setup</h2>
      <p class="muted">UI-Skelett für Möbelauswahl und spätere Generierung.</p>
    </div>
  </Card>

  <Card>
    <div class="stack">
      <Select
        bind:value={furniture}
        id="room-furniture"
        label="Möbelbild"
        options={[
          { value: 'placeholder-chair', label: 'Chair Placeholder' },
          { value: 'placeholder-table', label: 'Table Placeholder' }
        ]}
      />
      <Select
        bind:value={style}
        id="room-style"
        label="Stil"
        options={[
          { value: 'original', label: 'Original' },
          { value: 'editorial', label: 'Editorial' },
          { value: 'wohnlich', label: 'Wohnlich' }
        ]}
      />
      <Select
        bind:value={light}
        id="room-light"
        label="Licht"
        options={[
          { value: 'original', label: 'Original' },
          { value: 'tageslicht', label: 'Tageslicht' },
          { value: 'abendlicht', label: 'Abendlicht' }
        ]}
      />
      <Select
        bind:value={variants}
        id="room-variants"
        label="Varianten"
        options={[
          { value: '1', label: '1 Variante' },
          { value: '2', label: '2 Varianten' },
          { value: '3', label: '3 Varianten' }
        ]}
      />
      <Button variant="primary" disabled>Generate kommt später</Button>
    </div>
  </Card>
</div>

<style>
  h2,
  p {
    margin: 0;
  }
</style>
