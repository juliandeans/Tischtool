<script lang="ts">
  import Select from '$lib/components/ui/Select.svelte';

  export let id = 'preset-select';
  export let label = 'Preset';
  export let description = '';
  export let value = '';
  export let options = [
    { value: 'original', label: 'Original' },
    { value: 'editorial', label: 'Editorial' },
    { value: 'wohnlich', label: 'Wohnlich' }
  ];
</script>

<Select {id} {label} {description} bind:value {options} />
